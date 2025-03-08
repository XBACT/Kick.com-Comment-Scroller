// ==UserScript==
// @name         Kick Comment Scroller
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Scroll the KICK comments to the screen.
// @match        https://kick.com/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
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
        blockEmoji: true,
        lineSpacing: 10.0,
        ngComments: '',
    };
    if (localStorage.getItem('kickCommentScrollerSettings')) {
        settings = JSON.parse(localStorage.getItem('kickCommentScrollerSettings'));
    }
    const currentUrl = window.location.href;
    const isUserPage = /^https:\/\/kick\.com\/[a-zA-Z0-9_-]+$/.test(currentUrl);
    let scrollContainer = document.createElement('div');
    scrollContainer.style.position = 'absolute';
    scrollContainer.style.pointerEvents = 'none';
    scrollContainer.style.zIndex = '9999';
    scrollContainer.style.overflow = 'hidden';
    scrollContainer.style.top = '0px';
    scrollContainer.style.left = '0px';
    scrollContainer.style.width = '100%';
    scrollContainer.style.height = '100%';
    const settingsPanel = document.createElement('div');
    settingsPanel.style.position = 'absolute';
    settingsPanel.style.zIndex = '10000';
    settingsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    settingsPanel.style.color = '#fff';
    settingsPanel.style.padding = '10px';
    settingsPanel.style.borderRadius = '5px';
    settingsPanel.style.fontSize = '14px';
    settingsPanel.style.display = 'none';
    document.body.appendChild(settingsPanel);
    function createSettingsPanel() {
        if (!isUserPage) return;
        settingsPanel.innerHTML = `
            <h3>設定</h3>
            <label>通過時間 (秒): <input type="range" id="duration" min="1" max="10" step="0.5" value="${settings.duration}"><span id="durationValue">${settings.duration}</span></label><br>
            <label>フォントサイズ (px): <input type="range" id="fontSize" min="12" max="100" step="1" value="${parseInt(settings.fontSize)}"><span id="fontSizeValue">${parseInt(settings.fontSize)}</span></label><br>
            <label>フォントファミリー:
                <select id="fontFamily">
                    <option value="'SM P ゴシック', sans-serif" ${settings.fontFamily === "'SM P ゴシック', sans-serif" ? 'selected' : ''}>SM P ゴシック</option>
                    <option value="'Arial', sans-serif" ${settings.fontFamily === "'Arial', sans-serif" ? 'selected' : ''}>Arial</option>
                    <option value="'Helvetica', sans-serif" ${settings.fontFamily === "'Helvetica', sans-serif" ? 'selected' : ''}>Helvetica</option>
                    <option value="'Times New Roman', serif" ${settings.fontFamily === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
                    <option value="'Courier New', monospace" ${settings.fontFamily === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                </select>
            </label><br>
            <label>透明度: <input type="range" id="opacity" min="0" max="1" step="0.1" value="${settings.opacity}"><span id="opacityValue">${settings.opacity}</span></label><br>
            <label>縁の太さ (px): <input type="range" id="strokeWidth" min="0" max="10" step="0.5" value="${parseFloat(settings.strokeWidth)}"><span id="strokeWidthValue">${parseFloat(settings.strokeWidth)}</span></label><br>
            <label>縁の透明度: <input type="range" id="strokeOpacity" min="0" max="1" step="0.1" value="${settings.strokeOpacity}"><span id="strokeOpacityValue">${settings.strokeOpacity}</span></label><br>
            <label>縁の色: <input type="color" id="strokeColor" value="${settings.strokeColor}"><span id="strokeColorValue">${settings.strokeColor}</span></label><br>
            <label>テキストの色: <input type="color" id="textColor" value="${settings.textColor}"><span id="textColorValue">${settings.textColor}</span></label><br>
            <label>行間: <input type="range" id="lineSpacing" min="0" max="10" step="0.1" value="${settings.lineSpacing}"><span id="lineSpacingValue">${settings.lineSpacing.toFixed(1)}</span></label><br>
            <label>絵文字をブロック: <input type="checkbox" id="blockEmoji" ${settings.blockEmoji ? 'checked' : ''}></label><br>
            <label>フォントの太さ:
                <select id="fontWeight">
                    <option value="normal" ${settings.fontWeight === 'normal' ? 'selected' : ''}>標準</option>
                    <option value="bold" ${settings.fontWeight === 'bold' ? 'selected' : ''}>太字</option>
                    <option value="700" ${settings.fontWeight === '700' ? 'selected' : ''}>700</option>
                    <option value="900" ${settings.fontWeight === '900' ? 'selected' : ''}>900</option>
                </select>
            </label><br>
            <label>NGコメントリスト (カンマ区切り): <input type="text" id="ngComments" value="${settings.ngComments}" placeholder="例: スパム,広告,NGワード"></label><br>
            <button id="closeSettings">閉じる</button>
            <button id="clearComments">コメントを削除</button>
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
        document.getElementById('lineSpacing').addEventListener('input', (e) => {
            settings.lineSpacing = parseFloat(e.target.value);
            document.getElementById('lineSpacingValue').textContent = settings.lineSpacing.toFixed(1);
            localStorage.setItem('kickCommentScrollerSettings', JSON.stringify(settings));
        });
        document.getElementById('blockEmoji').addEventListener('change', (e) => {
            settings.blockEmoji = e.target.checked;
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
        document.getElementById('closeSettings').addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });
        document.getElementById('clearComments').addEventListener('click', () => {
            while (scrollContainer.firstChild) {
                scrollContainer.removeChild(scrollContainer.firstChild);
            }
            displayedComments.clear();
            usedHeights.length = 0;
        });
    }
    const settingsButton = document.createElement('button');
    settingsButton.textContent = '設定';
    settingsButton.style.position = 'fixed';
    settingsButton.style.zIndex = '10000';
    settingsButton.style.bottom = '11px';
    settingsButton.style.right = '149px';
    settingsButton.style.padding = '5px 10px';
    settingsButton.style.backgroundColor = '#333';
    settingsButton.style.color = '#fff';
    settingsButton.style.border = 'none';
    settingsButton.style.borderRadius = '3px';
    settingsButton.style.cursor = 'pointer';
    settingsButton.style.fontFamily = "'Inter', sans-serif";
    settingsButton.style.fontWeight = '600';
    settingsButton.style.display = isUserPage ? 'block' : 'none';
    settingsButton.addEventListener('click', () => {
        settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
        if (settingsPanel.style.display === 'block') {
            const rect = getVideoFrame().getBoundingClientRect();
            settingsPanel.style.top = `${rect.top + window.scrollY + 10}px`;
            settingsPanel.style.left = `${rect.left + window.scrollX + rect.width - settingsPanel.offsetWidth - 10}px`;
        }
    });
    document.body.appendChild(settingsButton);
    function getVideoFrame() {
        let videoFrame = document.querySelector('div.relative.aspect-video.w-full') ||
                        document.querySelector('div[id*="amazon-ivs-player"]')?.parentElement ||
                        document.querySelector('video')?.parentElement?.parentElement ||
                        document.querySelector('div[class*="video-player"]') ||
                        document.querySelector('div[class*="player-container"]');
        if (!videoFrame) {
            videoFrame = {
                offsetTop: window.innerHeight * 0.2,
                offsetLeft: window.innerWidth * 0.2,
                offsetWidth: window.innerWidth * 0.6,
                offsetHeight: window.innerHeight * 0.6
            };
        }
        return videoFrame;
    }
    function updateScrollContainer() {
        const videoFrame = getVideoFrame();
        if (scrollContainer.parentNode) {
            scrollContainer.parentNode.removeChild(scrollContainer);
        }
        videoFrame.appendChild(scrollContainer);
        const rect = videoFrame.getBoundingClientRect();
        scrollContainer.style.top = '0px';
        scrollContainer.style.left = '0px';
        scrollContainer.style.width = `${rect.width}px`;
        scrollContainer.style.height = `${rect.height}px`;
        if (settingsPanel.style.display === 'block') {
            settingsPanel.style.top = `${rect.top + window.scrollY + 10}px`;
            settingsPanel.style.left = `${rect.left + window.scrollX + rect.width - settingsPanel.offsetWidth - 10}px`;
        }
    }
    const displayedComments = new Set();
    const usedHeights = [];
    const MAX_HEIGHTS = 10;
    function getNextHeight(frameHeight) {
        if (usedHeights.length === 0) {
            usedHeights.push(0);
            return 0;
        }
        for (let i = 0; i < MAX_HEIGHTS; i++) {
            const height = i * (settings.lineSpacing + parseInt(settings.fontSize));
            const topPosition = height % frameHeight;
            if (!usedHeights.some(h => Math.abs(h - topPosition) < (settings.lineSpacing + parseInt(settings.fontSize)))) {
                usedHeights.push(topPosition);
                return topPosition;
            }
        }
        const randomIndex = Math.floor(Math.random() * usedHeights.length);
        return usedHeights[randomIndex];
    }
    function applyStrokeEffect(element) {
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
    }
    function isNgComment(commentText) {
        if (!settings.ngComments) return false;
        const ngList = settings.ngComments.split(',').map(word => word.trim()).filter(word => word);
        return ngList.some(word => commentText.includes(word));
    }
    function scrollComment(commentText) {
        if (!commentText || displayedComments.has(commentText)) return;
        if (isNgComment(commentText)) {
            return;
        }
        displayedComments.add(commentText);
        const videoFrame = getVideoFrame();
        const rect = videoFrame.getBoundingClientRect();
        const frameWidth = rect.width;
        const frameHeight = rect.height;
        const topPosition = getNextHeight(frameHeight);
        const scrollComment = document.createElement('span');
        scrollComment.textContent = commentText;
        scrollComment.style.position = 'absolute';
        scrollComment.style.color = settings.textColor;
        applyStrokeEffect(scrollComment);
        scrollComment.style.fontSize = settings.fontSize;
        scrollComment.style.fontFamily = settings.fontFamily;
        scrollComment.style.fontWeight = settings.fontWeight;
        scrollComment.style.opacity = settings.opacity;
        scrollComment.style.whiteSpace = 'nowrap';
        scrollComment.style.left = `${frameWidth}px`;
        scrollComment.style.top = `${topPosition}px`;
        scrollContainer.appendChild(scrollComment);
        const commentWidth = scrollComment.offsetWidth;
        try {
            scrollComment.style.animation = `scroll ${settings.duration}s linear forwards`;
            scrollComment.style.setProperty('--travel-distance', `-${frameWidth + commentWidth}px`);
        } catch (error) {}
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes scroll {
                from {
                    transform: translateX(0);
                }
                to {
                    transform: translateX(var(--travel-distance));
                }
            }
        `;
        document.head.appendChild(styleSheet);
        setTimeout(() => {
            scrollComment.remove();
            usedHeights.splice(usedHeights.indexOf(topPosition), 1);
            displayedComments.delete(commentText);
        }, settings.duration * 1000);
    }
    function setupObserver(target) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const newNodes = mutation.addedNodes;
                for (let node of newNodes) {
                    if (node.nodeType === 1) {
                        let commentText = null;
                        let commentElement = node.querySelector('span[class*="font-normal"][class*="leading-\\[1\\.55\\]"]');
                        if (commentElement) {
                            if (!settings.blockEmoji || !commentElement.querySelector('img, [class*="emoji"], [class*="kick-emoji"]')) {
                                commentText = commentElement.textContent.trim().replace(/^\s+|\s+$/g, '');
                            }
                        }
                        if (!commentText) {
                            const textElements = node.querySelectorAll('span, p, div');
                            for (let element of textElements) {
                                if (!settings.blockEmoji || !element.querySelector('img, [class*="emoji"], [class*="kick-emoji"]')) {
                                    const text = element.textContent.trim().replace(/^\s+|\s+$/g, '');
                                    if (text && !/^\d{2}:\d{2}$/.test(text) && text.length > 0 && !text.includes('Kick Comment Scroller')) {
                                        commentText = text;
                                        break;
                                    }
                                }
                            }
                        }
                        if (!commentText) {
                            const nodeText = node.textContent.trim().replace(/^\s+|\s+$/g, '');
                            if (nodeText && !/^\d{2}:\d{2}$/.test(nodeText) && nodeText.length > 0 && !nodeText.includes('Kick Comment Scroller')) {
                                if (!settings.blockEmoji || !node.querySelector('img, [class*="emoji"], [class*="kick-emoji"]')) {
                                    commentText = nodeText;
                                }
                            }
                        }
                        if (commentText) {
                            if (commentText && commentText.length > 0 && !/^\d{2}:\d{2}$/.test(commentText)) {
                                scrollComment(commentText);
                            }
                        }
                    }
                }
            });
        });
        observer.observe(target, { childList: true, subtree: true });
    }
    function findChatContainer() {
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
    }
    function monitorChatContainer() {
        const chatContainer = findChatContainer();
        if (chatContainer) {
            setupObserver(chatContainer);
        } else {
            setTimeout(monitorChatContainer, 5000);
        }
    }
    window.addEventListener('load', () => {
        createSettingsPanel();
        updateScrollContainer();
        monitorChatContainer();
    });
    monitorChatContainer();
    window.addEventListener('resize', updateScrollContainer);
    window.addEventListener('scroll', updateScrollContainer);
})();
