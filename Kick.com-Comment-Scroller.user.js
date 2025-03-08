// ==UserScript==
// @name         Kickコメントスクロール, Kick弾幕, Kick Comment Scroller
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Kickで弾幕を表示
// @match        https://kick.com/*
// @license      MIT
// @grant        none
// @run-at       document-end
// @name:en      Kick Comment Scroller
// @description:en Scroll the KICK comments to the screen.
// @updateURL    https://raw.githubusercontent.com/XBACT/Kick.com-Comment-Scroller/blob/main/Kick.com-Comment-Scroller.user.js
// @downloadURL  https://raw.githubusercontent.com/XBACT/Kick.com-Comment-Scroller/blob/main/Kick.com-Comment-Scroller.user.js
// @homepageURL   https://github.com/あなたのユーザー名/あなたのレポジトリ
// @supportURL    https://github.com/XBACT/Kick.com-Comment-Scroller/issues
// ==/UserScript==

(function() {
    'use strict';

    const translations = {
        ja: {
            title: "設定",
            duration: "通過時間 (秒)",
            fontSize: "テキストサイズ (px)",
            fontFamily: "フォント",
            opacity: "透明度",
            strokeWidth: "縁の太さ (px)",
            strokeOpacity: "縁の透明度",
            strokeColor: "縁の色",
            textColor: "テキストの色",
            lineSpacing: "行間（フォントサイズに対する割合）",
            blockEmoji: "絵文字を表示",
            fontWeight: "フォントの太さ",
            ngComments: "NGコメントリスト (カンマ区切り)",
            ngRegex: "正規表現フィルタ (オプション)",
            randomColor: "コメント色をランダムにする",
            close: "閉じる",
            clearComments: "コメントを削除",
            maxComments: "最大表示数",
            unlimitedMaxComments: "最大表示数を無制限にする",
            language: "言語"
        },
        en: {
            title: "Settings",
            duration: "Duration (seconds)",
            fontSize: "Font Size (px)",
            fontFamily: "Font Family",
            opacity: "Opacity",
            strokeWidth: "Stroke Width (px)",
            strokeOpacity: "Stroke Opacity",
            strokeColor: "Stroke Color",
            textColor: "Text Color",
            lineSpacing: "Line Spacing (ratio to font size)",
            blockEmoji: "Show Emojis",
            fontWeight: "Font Weight",
            ngComments: "Blocked Comments (comma-separated)",
            ngRegex: "Regex Filter (Optional)",
            randomColor: "Randomize Comment Color",
            close: "Close",
            clearComments: "Clear Comments",
            maxComments: "Max Comments",
            unlimitedMaxComments: "Unlimited Max Comments",
            language: "Language"
        }
    };

    let settings = {
        duration: 5,
        fontSize: '75px',
        fontWeight: 'normal',
        fontFamily: "'SM P ゴシック', sans-serif",
        strokeWidth: '3.5px',
        strokeOpacity: 0.1,
        strokeColor: '#000000',
        textColor: '#ffffff',
        opacity: 1,
        blockEmoji: false,
        lineSpacing: 0.5,
        ngComments: '',
        ngRegex: '',
        randomColor: false,
        language: 'ja',
        maxComments: 50,
        unlimitedMaxComments: false
    };

    try {
        if (localStorage.getItem('kickCommentScrollerSettings')) {
            settings = JSON.parse(localStorage.getItem('kickCommentScrollerSettings'));
            if (!settings.language || !translations[settings.language]) {
                settings.language = 'ja';
            }
        }
    } catch (e) {}

    const currentUrl = window.location.href;
    const isUserPage = /^https:\/\/kick\.com\/[a-zA-Z0-9_-]+/.test(currentUrl);

    let scrollContainer = document.createElement('div');
    scrollContainer.id = 'kickCommentScrollerContainer';
    Object.assign(scrollContainer.style, {
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: '9999',
        overflow: 'hidden',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%'
    });

    let settingsPanel = document.createElement('div');
    settingsPanel.id = 'kickCommentScrollerSettings';
    Object.assign(settingsPanel.style, {
        position: 'absolute',
        zIndex: '10000',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        display: 'none',
        visibility: 'visible',
        opacity: '1'
    });

    let settingsButton = document.createElement('button');
    settingsButton.id = 'kickCommentScrollerButton';
    settingsButton.textContent = '設定';
    Object.assign(settingsButton.style, {
        position: 'fixed',
        zIndex: '10000',
        bottom: '11px',
        right: '149px',
        padding: '5px 10px',
        backgroundColor: '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        fontWeight: '600',
        display: 'block',
        visibility: 'visible',
        opacity: '1'
    });

    settingsButton.addEventListener('click', () => {
        try {
            if (settingsPanel.classList.contains('visible')) {
                settingsPanel.classList.remove('visible');
                settingsPanel.style.display = 'none';
            } else {
                settingsPanel.classList.add('visible');
                settingsPanel.style.display = 'block';
                setPanelPosition();
            }
        } catch (e) {}
    });

    let styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

    let settingsPanelInitialized = false;

    function updateStylesheet() {
        styleSheet.textContent = `
            #kickCommentScrollerContainer span > img {
                display: inline-block !important;
                vertical-align: middle !important;
                margin: 0 2px !important;
                object-fit: contain !important;
                height: ${settings.fontSize} !important;
                width: ${settings.fontSize} !important;
                max-height: ${settings.fontSize} !important;
                max-width: ${settings.fontSize} !important;
            }
            #kickCommentScrollerButton {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            #kickCommentScrollerSettings {
                display: none;
                visibility: visible !important;
                opacity: 1 !important;
            }
            #kickCommentScrollerSettings.visible {
                display: block !important;
            }
            #kickCommentScrollerSettings h3 {
                cursor: move;
                margin: 0 0 10px 0;
                padding: 5px;
                background-color: rgba(255, 255, 255, 0.1);
            }
        `;
    }

    updateStylesheet();

    function createSettingsPanel() {
        if (settingsPanelInitialized) {
            return;
        }
        try {
            const t = translations[settings.language] || translations['ja'];
            settingsPanel.innerHTML = `
                <h3>${t.title}</h3>
                <label>${t.duration}: <input type="range" id="duration" min="1" max="10" step="0.5" value="${settings.duration}"><span id="durationValue">${settings.duration}</span></label><br>
                <label>${t.fontSize}: <input type="range" id="fontSize" min="12" max="100" step="1" value="${parseInt(settings.fontSize)}"><span id="fontSizeValue">${parseInt(settings.fontSize)}</span></label><br>
                <label>${t.fontFamily}: 
                    <select id="fontFamily">
                        <option value="'SM P ゴシック', sans-serif" ${settings.fontFamily === "'SM P ゴシック', sans-serif" ? 'selected' : ''}>SM P ゴシック</option>
                        <option value="'Arial', sans-serif" ${settings.fontFamily === "'Arial', sans-serif" ? 'selected' : ''}>Arial</option>
                        <option value="'Helvetica', sans-serif" ${settings.fontFamily === "'Helvetica', sans-serif" ? 'selected' : ''}>Helvetica</option>
                        <option value="'Times New Roman', serif" ${settings.fontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
                        <option value="'Courier New', monospace" ${settings.fontFamily === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                    </select>
                </label><br>
                <label>${t.opacity}: <input type="range" id="opacity" min="0" max="1" step="0.1" value="${settings.opacity}"><span id="opacityValue">${settings.opacity}</span></label><br>
                <label>${t.strokeWidth}: <input type="range" id="strokeWidth" min="0" max="10" step="0.5" value="${parseFloat(settings.strokeWidth)}"><span id="strokeWidthValue">${parseFloat(settings.strokeWidth)}</span></label><br>
                <label>${t.strokeOpacity}: <input type="range" id="strokeOpacity" min="0" max="1" step="0.1" value="${settings.strokeOpacity}"><span id="strokeOpacityValue">${settings.strokeOpacity}</span></label><br>
                <label>${t.strokeColor}: <input type="color" id="strokeColor" value="${settings.strokeColor}"><span id="strokeColorValue">${settings.strokeColor}</span></label><br>
                <label>${t.textColor}: <input type="color" id="textColor" value="${settings.textColor}"><span id="textColorValue">${settings.textColor}</span></label><br>
                <label>${t.randomColor}: <input type="checkbox" id="randomColor" ${settings.randomColor ? 'checked' : ''}></label><br>
                <label>${t.lineSpacing}: <input type="range" id="lineSpacing" min="0" max="1" step="0.1" value="${settings.lineSpacing}"><span id="lineSpacingValue">${settings.lineSpacing.toFixed(1)}</span></label><br>
                <label>${t.blockEmoji}: <input type="checkbox" id="blockEmoji" ${settings.blockEmoji ? '' : 'checked'}></label><br>
                <label>${t.fontWeight}: 
                    <select id="fontWeight">
                        <option value="normal" ${settings.fontWeight === 'normal' ? 'selected' : ''}>${settings.language === 'ja' ? '標準' : 'Normal'}</option>
                        <option value="bold" ${settings.fontWeight === 'bold' ? 'selected' : ''}>${settings.language === 'ja' ? '太字' : 'Bold'}</option>
                        <option value="700" ${settings.fontWeight === '700' ? 'selected' : ''}>700</option>
                        <option value="900" ${settings.fontWeight === '900' ? 'selected' : ''}>900</option>
                    </select>
                </label><br>
                <label>${t.ngComments}: <input type="text" id="ngComments" value="${settings.ngComments}" placeholder="${settings.language === 'ja' ? '例: スパム,広告,NGワード' : 'e.g., spam,ad,NGword'}"></label><br>
                <label>${t.ngRegex}: <input type="text" id="ngRegex" value="${settings.ngRegex}" placeholder="${settings.language === 'ja' ? '例: ^(spam|ad)$' : 'e.g., ^(spam|ad)$'}"></label><br>
                <label>${t.maxComments}: <input type="range" id="maxComments" min="10" max="100" step="5" value="${settings.maxComments}" ${settings.unlimitedMaxComments ? 'disabled' : ''}><span id="maxCommentsValue">${settings.maxComments}</span></label><br>
                <label>${t.unlimitedMaxComments}: <input type="checkbox" id="unlimitedMaxComments" ${settings.unlimitedMaxComments ? 'checked' : ''}></label><br>
                <label>${t.language}: 
                    <select id="language">
                        <option value="ja" ${settings.language === 'ja' ? 'selected' : ''}>日本語</option>
                        <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                    </select>
                </label><br>
                <button id="closeSettings">${t.close}</button>
                <button id="clearComments">${t.clearComments}</button>
            `;

            document.getElementById('duration').addEventListener('input', (e) => {
                settings.duration = parseFloat(e.target.value);
                document.getElementById('durationValue').textContent = settings.duration;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('fontSize').addEventListener('input', (e) => {
                settings.fontSize = `${parseInt(e.target.value)}px`;
                document.getElementById('fontSizeValue').textContent = parseInt(e.target.value);
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
                updateStylesheet();
            });

            document.getElementById('fontFamily').addEventListener('change', (e) => {
                settings.fontFamily = e.target.value;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('opacity').addEventListener('input', (e) => {
                settings.opacity = parseFloat(e.target.value);
                document.getElementById('opacityValue').textContent = settings.opacity.toFixed(1);
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('strokeWidth').addEventListener('input', (e) => {
                settings.strokeWidth = `${parseFloat(e.target.value)}px`;
                document.getElementById('strokeWidthValue').textContent = parseFloat(e.target.value);
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('strokeOpacity').addEventListener('input', (e) => {
                settings.strokeOpacity = parseFloat(e.target.value);
                document.getElementById('strokeOpacityValue').textContent = settings.strokeOpacity.toFixed(1);
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('strokeColor').addEventListener('input', (e) => {
                settings.strokeColor = e.target.value;
                document.getElementById('strokeColorValue').textContent = settings.strokeColor;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('textColor').addEventListener('input', (e) => {
                settings.textColor = e.target.value;
                document.getElementById('textColorValue').textContent = settings.textColor;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('randomColor').addEventListener('change', (e) => {
                settings.randomColor = e.target.checked;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('lineSpacing').addEventListener('input', (e) => {
                settings.lineSpacing = parseFloat(e.target.value);
                document.getElementById('lineSpacingValue').textContent = settings.lineSpacing.toFixed(1);
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('blockEmoji').addEventListener('change', (e) => {
                settings.blockEmoji = !e.target.checked;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('fontWeight').addEventListener('change', (e) => {
                settings.fontWeight = e.target.value;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('ngComments').addEventListener('input', (e) => {
                settings.ngComments = e.target.value;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('ngRegex').addEventListener('input', (e) => {
                settings.ngRegex = e.target.value;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('maxComments').addEventListener('input', (e) => {
                settings.maxComments = parseInt(e.target.value);
                document.getElementById('maxCommentsValue').textContent = settings.maxComments;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('unlimitedMaxComments').addEventListener('change', (e) => {
                settings.unlimitedMaxComments = e.target.checked;
                document.getElementById('maxComments').disabled = settings.unlimitedMaxComments;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
            });

            document.getElementById('language').addEventListener('change', (e) => {
                settings.language = e.target.value;
                localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
                settingsPanelInitialized = false;
                createSettingsPanel();
            });

            document.getElementById('closeSettings').addEventListener('click', () => {
                settingsPanel.classList.remove('visible');
                settingsPanel.style.display = 'none';
            });

            document.getElementById('clearComments').addEventListener('click', () => {
                while (scrollContainer.firstChild) {
                    scrollContainer.removeChild(scrollContainer.firstChild);
                }
                displayedComments.clear();
                usedHeights.length = 0;
            });

            const header = settingsPanel.querySelector('h3');
            header.addEventListener('mousedown', (e) => {
                let shiftX = e.clientX - settingsPanel.getBoundingClientRect().left;
                let shiftY = e.clientY - settingsPanel.getBoundingClientRect().top;

                function moveAt(pageX, pageY) {
                    settingsPanel.style.left = pageX - shiftX + 'px';
                    settingsPanel.style.top = pageY - shiftY + 'px';
                }

                function onMouseMove(event) {
                    moveAt(event.pageX, event.pageY);
                }

                document.addEventListener('mousemove', onMouseMove);

                document.addEventListener('mouseup', () => {
                    document.removeEventListener('mousemove', onMouseMove);
                }, { once: true });
            });

            settingsPanel.ondragstart = () => false;

            settingsPanelInitialized = true;
        } catch (e) {}
    }

    function ensurePanelInDOM() {
        try {
            if (!document.getElementById('kickCommentScrollerSettings') && document.body) {
                document.body.appendChild(settingsPanel);
            } else if (document.getElementById('kickCommentScrollerSettings')) {
            } else {
                setTimeout(ensurePanelInDOM, 100);
            }
        } catch (e) {}
    }

    function ensureButtonInDOM() {
        try {
            if (!document.getElementById('kickCommentScrollerButton') && document.body) {
                document.body.appendChild(settingsButton);
            } else if (document.getElementById('kickCommentScrollerButton')) {
            } else {
                setTimeout(ensureButtonInDOM, 100);
            }
        } catch (e) {}
    }

    function ensurePanelAndContent() {
        try {
            ensurePanelInDOM();
            if (settingsPanel.innerHTML.trim() === '' || !settingsPanelInitialized) {
                createSettingsPanel();
            }
        } catch (e) {}
    }
    setInterval(ensurePanelAndContent, 5000);

    function ensureSettingsButton() {
        try {
            ensureButtonInDOM();
        } catch (e) {}
    }
    setInterval(ensureSettingsButton, 5000);

    function getVideoFrame() {
        try {
            let videoFrame = document.querySelector('div.relative.aspect-video.w-full') || 
                            document.querySelector('div[id*="amazon-ivs-player"]')?.parentElement || 
                            document.querySelector('video')?.parentElement?.parentElement || 
                            document.querySelector('div[class*="video-player"]') || 
                            document.querySelector('div[class*="player-container"]') || 
                            document.body;
            if (!videoFrame || !videoFrame.getBoundingClientRect) {
                videoFrame = { 
                    offsetTop: 0,
                    offsetLeft: 0,
                    offsetWidth: window.innerWidth,
                    offsetHeight: window.innerHeight,
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    getBoundingClientRect: () => ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight })
                };
            }
            return videoFrame;
        } catch (e) {
            return {
                offsetTop: 0,
                offsetLeft: 0,
                offsetWidth: window.innerWidth,
                offsetHeight: window.innerHeight,
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                getBoundingClientRect: () => ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight })
            };
        }
    }

    function setPanelPosition() {
        try {
            const checkPosition = () => {
                if (settingsPanel.offsetWidth === 0 || settingsPanel.offsetHeight === 0) {
                    setTimeout(checkPosition, 1);
                    return;
                }
                const rect = getVideoFrame().getBoundingClientRect ? getVideoFrame().getBoundingClientRect() : getVideoFrame();
                const top = rect.top + window.scrollY + 10;
                const left = Math.max(10, rect.left + window.scrollX + 10);
                Object.assign(settingsPanel.style, {
                    top: `${top}px`,
                    left: `${left}px`
                });
            };
            checkPosition();
        } catch (e) {}
    }

    function updateScrollContainer() {
        try {
            const videoFrame = getVideoFrame();
            if (videoFrame && !document.getElementById('kickCommentScrollerContainer')) {
                videoFrame.appendChild ? videoFrame.appendChild(scrollContainer) : document.body.appendChild(scrollContainer);
            } else if (videoFrame) {
                const rect = videoFrame.getBoundingClientRect ? videoFrame.getBoundingClientRect() : videoFrame;
                Object.assign(scrollContainer.style, {
                    top: '0px',
                    left: '0px',
                    width: `${rect.width}px`,
                    height: `${rect.height}px`
                });
            }

            if (settingsPanel.classList.contains('visible')) {
                setPanelPosition();
            }
        } catch (e) {}
    }

    const displayedComments = new Set();
    const usedHeights = [];
    const MAX_HEIGHTS = 10;

    function getNextHeight(frameHeight, commentHeight) {
        try {
            if (usedHeights.length === 0) {
                usedHeights.push(0);
                return 0;
            }

            const fontSizePx = parseInt(settings.fontSize);
            const scaledLineSpacing = fontSizePx * settings.lineSpacing;
            const minSpacing = Math.max(fontSizePx, commentHeight);
            const totalSpacing = minSpacing + scaledLineSpacing;

            for (let i = 0; i < MAX_HEIGHTS; i++) {
                const height = i * totalSpacing;
                const topPosition = height % frameHeight;
                if (!usedHeights.some(h => Math.abs(h - topPosition) < minSpacing)) {
                    usedHeights.push(topPosition);
                    return topPosition;
                }
            }

            const randomIndex = Math.floor(Math.random() * usedHeights.length);
            return usedHeights[randomIndex];
        } catch (e) {
            return 0;
        }
    }

    function applyStrokeEffect(element) {
        try {
            const w = parseFloat(settings.strokeWidth) || 2;
            const strokeColor = `${settings.strokeColor}${Math.round((settings.strokeOpacity || 0.8) * 255).toString(16).padStart(2, '0')}`;
            const shadow = `
                ${w}px ${w}px 0 ${strokeColor},
                ${-w}px ${w}px 0 ${strokeColor},
                ${w}px ${-w}px 0 ${strokeColor},
                ${-w}px ${-w}px 0 ${strokeColor},
                ${w}px 0px 0 ${strokeColor},
                ${-w}px 0px 0 ${strokeColor},
                0px ${w}px 0 ${strokeColor},
                0px ${-w}px 0 ${strokeColor}
            `;
            element.style.textShadow = shadow;
        } catch (e) {}
    }

    function isNgComment(commentText) {
        try {
            if (settings.ngComments) {
                const ngList = settings.ngComments.split(',').map(word => word.trim()).filter(word => word);
                if (ngList.some(word => commentText.includes(word))) {
                    return true;
                }
            }
            if (settings.ngRegex) {
                const regex = new RegExp(settings.ngRegex, 'i');
                if (regex.test(commentText)) {
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function scrollComment(commentText, imgElements = [], uniqueId) {
        try {
            if (!commentText && imgElements.length === 0) {
                return;
            }

            if (isNgComment(commentText)) {
                return;
            }

            if (!settings.unlimitedMaxComments && displayedComments.size >= settings.maxComments) {
                return;
            }

            displayedComments.add(uniqueId);

            const videoFrame = getVideoFrame();
            const rect = videoFrame.getBoundingClientRect ? videoFrame.getBoundingClientRect() : videoFrame;
            const frameWidth = rect.width;
            const frameHeight = rect.height;

            const scrollComment = document.createElement('span');
            Object.assign(scrollComment.style, {
                position: 'absolute',
                color: settings.randomColor ? getRandomColor() : settings.textColor,
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily,
                fontWeight: settings.fontWeight,
                opacity: settings.opacity,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: settings.fontSize,
                height: settings.fontSize
            });
            applyStrokeEffect(scrollComment);

            if (commentText && commentText.trim()) {
                scrollComment.appendChild(document.createTextNode(commentText));
            }

            if (imgElements.length > 0 && !settings.blockEmoji) {
                imgElements.forEach(img => {
                    const clonedImg = document.createElement('img');
                    clonedImg.src = img.src;
                    Object.assign(clonedImg.style, {
                        height: settings.fontSize,
                        width: settings.fontSize,
                        objectFit: 'contain',
                        verticalAlign: 'middle',
                        margin: '0 2px',
                        display: 'inline-block'
                    });
                    scrollComment.appendChild(clonedImg);
                });
            }

            scrollContainer.appendChild(scrollComment);
            const commentWidth = scrollComment.offsetWidth;
            const commentHeight = scrollComment.offsetHeight;
            scrollComment.style.height = `${commentHeight}px`;

            const topPosition = getNextHeight(frameHeight, commentHeight);
            scrollComment.style.top = `${topPosition}px`;
            scrollComment.style.left = `${frameWidth}px`;

            const travelDistance = -(frameWidth + commentWidth);
            let startTime = null;

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = (timestamp - startTime) / (settings.duration * 1000);
                if (progress < 1) {
                    scrollComment.style.transform = `translateX(${travelDistance * progress}px)`;
                    requestAnimationFrame(animate);
                } else {
                    scrollComment.style.transform = `translateX(${travelDistance}px)`;
                    scrollComment.remove();
                    usedHeights.splice(usedHeights.indexOf(topPosition), 1);
                    displayedComments.delete(uniqueId);
                }
            }

            requestAnimationFrame(animate);

        } catch (e) {}
    }

    function setupObserver(target) {
        try {
            const observer = new MutationObserver((mutations) => {
                try {
                    mutations.forEach((mutation) => {
                        const newNodes = mutation.addedNodes;
                        for (let node of newNodes) {
                            if (node.nodeType !== 1) continue;

                            if (node.dataset && node.dataset.processed) continue;
                            node.dataset.processed = 'true';

                            let commentText = '';
                            let imgElements = [];

                            if (!settings.blockEmoji) {
                                const emoteSpans = node.querySelectorAll('span[data-emote-id]');
                                imgElements = Array.from(emoteSpans).map(span => {
                                    const img = span.querySelector('img');
                                    return img || null;
                                }).filter(img => img);
                            }

                            let contentNode = node.querySelector('span[class*="font-normal"][class*="leading-\\[1\\.55\\]"]');
                            if (contentNode) {
                                let rawText = contentNode.textContent.trim();
                                commentText = rawText.replace(/^\d{1,2}:\d{2}\s+[^:]+:\s*/, '').trim();
                                const childNodes = contentNode.childNodes;
                                for (let child of childNodes) {
                                    if (child.nodeType === 3) {
                                        let childText = child.textContent.trim();
                                        if (childText) {
                                            commentText = childText.replace(/^\d{1,2}:\d{2}\s+[^:]+:\s*/, '').trim();
                                            break;
                                        }
                                    }
                                }
                            }

                            if (!commentText && imgElements.length === 0) {
                                continue;
                            }

                            const imgSrcs = imgElements.map(img => img ? img.src : '').join('');
                            const uniqueId = `${commentText}_${imgSrcs}`;

                            if (displayedComments.has(uniqueId)) {
                                continue;
                            }

                            scrollComment(commentText, imgElements, uniqueId);
                        }
                    });
                } catch (e) {}
            });

            observer.observe(target, { childList: true, subtree: true });
        } catch (e) {}
    }

    function findChatContainer() {
        try {
            let container = document.getElementById('chatroom-messages');
            if (!container) {
                container = document.getElementById('chat-message-actions') || 
                            document.querySelector('div[data-index]') || 
                            document.querySelector('div[class*="chat"]') || 
                            document.querySelector('div[id*="chat"]') || 
                            document.querySelector('div[class*="message-container"]') || 
                            document.querySelector('div[class*="betterhover"]') || 
                            document.body;
            }
            return container;
        } catch (e) {
            return document.body;
        }
    }

    function monitorChatContainer() {
        try {
            const chatContainer = findChatContainer();
            if (chatContainer) {
                setupObserver(chatContainer);
            } else {
                setTimeout(monitorChatContainer, 5000);
            }
        } catch (e) {
            setTimeout(monitorChatContainer, 5000);
        }
    }

    function initialize() {
        try {
            if (document.body) {
                ensurePanelInDOM();
                ensureButtonInDOM();
                if (!settingsPanelInitialized) {
                    createSettingsPanel();
                }
                updateScrollContainer();
                monitorChatContainer();
            } else {
                setTimeout(initialize, 1000);
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initialize, 1000);
        });
    } else {
        setTimeout(initialize, 1000);
    }

    window.addEventListener('load', () => {
        initialize();
    });

    window.addEventListener('resize', updateScrollContainer);
    window.addEventListener('scroll', updateScrollContainer);
})();
