const params = new URLSearchParams(window.location.search);
const roomCode = params.get('room');
const username = params.get('username');
const gameMode = params.get('mode') || 'FLAG';
const roomType = params.get('type') || 'SINGLE';

let ws;
let startTime;
let worldData = {};
let worldSvg = null;
let userColor = '#4A90A4';
let guessedCountries = new Map();
let userAnsweredCorrectly = false;
let currentTimerInterval = null;

document.getElementById('roomCode').textContent = `Room: ${roomCode} | Mode: ${gameMode === 'FLAG' ? '🚩 Flag Quiz' : '🗺️ World Map'} | ${roomType === 'SINGLE' ? '👤 Single' : roomType === 'PRIVATE' ? '🔒 Private' : '🌐 Public'}`;

fetch('/static/world.json')
    .then(r => r.json())
    .then(data => { 
        worldData = data; 
        console.log('World data loaded:', Object.keys(worldData).length, 'countries'); 
        if (gameMode === 'WORLD_MAP') {
            showColorPicker();
        }
    })
    .catch(e => console.error('Failed to load world.json:', e));

function showColorPicker() {
    const colors = [
        { name: 'Ocean Blue', hex: '#4A90A4' },
        { name: 'Muted Rose', hex: '#B05F66' },
        { name: 'Desert Sand', hex: '#D9C18A' },
        { name: 'Purple', hex: '#9B59B6' },
        { name: 'Orange', hex: '#E67E22' },
        { name: 'Teal', hex: '#16A085' }
    ];
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    modal.innerHTML = `
        <div style="background: var(--bg-primary); padding: var(--space-8); border-radius: var(--radius-md); text-align: center; max-width: 500px;">
            <h3 style="margin-bottom: var(--space-6); color: var(--text-primary);">Choose Your Color</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);">
                ${colors.map(c => `
                    <button onclick="selectColor('${c.hex}')" style="padding: var(--space-4); border: 2px solid ${c.hex}; background: ${c.hex}; border-radius: var(--radius-base); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <div style="color: white; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">${c.name}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    window.colorModal = modal;
}

function selectColor(color) {
    userColor = color;
    if (window.colorModal) {
        window.colorModal.remove();
    }
}

function connectWebSocket() {
    const rounds = params.get('rounds') || '10';
    ws = new WebSocket(`ws://localhost:8085/ws?room=${roomCode}&username=${username}&mode=${gameMode}&type=${roomType}&rounds=${rounds}`);

    ws.onopen = () => {
        console.log('Connected to game server');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleMessage(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        setTimeout(connectWebSocket, 3000);
    };
}

function handleMessage(msg) {
    switch(msg.type) {
        case 'room_update':
            if (msg.payload.status === 'waiting') {
                showWaitingRoom(msg.payload);
            }
            break;
        case 'round_started':
            hideWaitingRoom();
            startRound(msg.payload);
            break;
        case 'answer_submitted':
            showAnswerFeedback(msg.payload);
            break;
        case 'score_update':
            updateScores(msg.payload);
            break;
        case 'round_ended':
            endRound(msg.payload);
            break;
        case 'game_completed':
            gameCompleted(msg.payload);
            break;
        case 'chat_message':
            addChatMessage(msg.payload);
            break;
        case 'player_joined':
            console.log(`${msg.payload.player_name} joined`);
            break;
        case 'player_left':
            console.log(`${msg.payload.player_name} left`);
            break;
    }
}

function startRound(payload) {
    userAnsweredCorrectly = false;
    
    const lastGuessed = document.getElementById('lastGuessed');
    if (lastGuessed) lastGuessed.style.display = 'none';
    
    if (currentTimerInterval) {
        clearInterval(currentTimerInterval);
    }
    
    document.getElementById('roundCounter').textContent = `Round ${payload.current_round}/${payload.total_rounds}`;
    
    if (gameMode === 'FLAG') {
        startTime = Date.now();
        const questionArea = document.querySelector('.question-area');
        questionArea.innerHTML = `
            <img id="flagImage" src="https://flagcdn.com/w320/${payload.question.flag_code.toLowerCase()}.png" alt="Flag" class="animate-fade-in">
            <div class="answer-input" style="margin-top: var(--space-4);">
                <input type="text" id="answerInput" class="form-input" placeholder="Type country name..." autocomplete="off">
            </div>
        `;
        document.getElementById('answerInput').focus();
        startTimer(payload.question.time_limit);
    } else if (gameMode === 'WORLD_MAP') {
        showWorldMap(payload.question.flag_code, payload.question.country_name, payload.question.time_limit);
    }
}

function startTimer(timeLimit) {
    startTime = Date.now();
    let timeLeft = timeLimit;
    const timerEl = document.getElementById('timer');
    
    currentTimerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        
        timerEl.className = 'timer';
        if (timeLeft < 5) {
            timerEl.classList.add('timer--red');
        } else if (timeLeft < 10) {
            timerEl.classList.add('timer--yellow');
        } else {
            timerEl.classList.add('timer--green');
        }
        
        if (timeLeft <= 0) {
            clearInterval(currentTimerInterval);
            const answerInput = document.getElementById('answerInput');
            if (answerInput) answerInput.disabled = true;
        }
    }, 1000);
}

function submitAnswer() {
    const answerInput = document.getElementById('answerInput');
    if (!answerInput || answerInput.disabled) return;
    
    if (answerInput.getAttribute('data-valid') !== 'true') {
        answerInput.style.animation = 'shake 0.3s';
        setTimeout(() => answerInput.style.animation = '', 300);
        return;
    }
    
    const answer = answerInput.value.trim();
    if (!answer) return;

    const responseTime = Date.now() - startTime;
    
    if (gameMode === 'WORLD_MAP' && targetCountryPath) {
        const countryCode = targetCountryPath.getAttribute('id');
        if (countryCode) {
            guessedCountries.set(countryCode.toUpperCase(), { color: userColor, name: answer });
        }
    }
    
    ws.send(JSON.stringify({
        type: 'submit_answer',
        payload: {
            answer: answer,
            response_time_ms: responseTime
        }
    }));

    answerInput.value = '';
    answerInput.disabled = true;
    answerInput.removeAttribute('data-valid');
}

function updateScores(payload) {
    const scoreList = document.getElementById('scoreList');
    if (!scoreList) return;
    
    scoreList.innerHTML = '';
    
    const scores = payload.scores || payload || {};
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    sortedScores.forEach(([player, score], index) => {
        const item = document.createElement('div');
        item.className = 'score-item animate-slide-up';
        
        if (player === username) {
            item.classList.add('current-user');
        }
        if (index === 0 && score > 0) {
            item.classList.add('rank-1');
        }
        
        const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        item.innerHTML = `
            <span class="score-player">${rank} ${player}</span>
            <span class="score-points">${score}</span>
        `;
        scoreList.appendChild(item);
    });
}

function showAnswerFeedback(payload) {
    console.log(`${payload.player} answered: ${payload.is_correct ? 'Correct!' : 'Wrong'}`);
    
    if (payload.is_correct && payload.country_name) {
        const lastGuessed = document.getElementById('lastGuessed');
        const lastGuessedName = document.getElementById('lastGuessedName');
        if (lastGuessed && lastGuessedName) {
            lastGuessedName.textContent = payload.country_name;
            lastGuessed.style.display = 'block';
        }
    }
    
    if (payload.player === username) {
        if (payload.is_correct) {
            userAnsweredCorrectly = true;
            
            if (currentTimerInterval) {
                clearInterval(currentTimerInterval);
            }
            
            const questionArea = document.querySelector('.question-area');
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: linear-gradient(135deg, #82A775, #6B8B68);
                color: white;
                padding: 2rem 3rem;
                border-radius: 1rem;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 1000;
                text-align: center;
                opacity: 0;
                animation: revealAnswer 0.5s ease-out forwards;
            `;
            overlay.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                <div style="font-size: 1.8rem; font-weight: bold; margin-bottom: 0.5rem;">Correct!</div>
                <div style="font-size: 1.2rem; opacity: 0.9;">Great job!</div>
            `;
            
            const style = document.createElement('style');
            style.textContent = `@keyframes revealAnswer { to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`;
            document.head.appendChild(style);
            
            document.body.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.animation = 'revealAnswer 0.3s ease-in reverse';
                setTimeout(() => overlay.remove(), 300);
            }, 2500);
        }
    } else if (payload.is_correct && len(r.Clients) > 1) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #82A775, #6B8B68);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            opacity: 0;
            animation: slideIn 0.3s ease-out forwards;
        `;
        notification.innerHTML = `<strong>${payload.player}</strong> guessed it! ✅`;
        
        const style = document.createElement('style');
        style.textContent = `@keyframes slideIn { to { opacity: 1; transform: translateX(0); } }`;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        if (currentTimerInterval) {
            clearInterval(currentTimerInterval);
        }
        
        setTimeout(() => notification.remove(), 3000);
    }
}

function endRound(payload) {
    if (gameMode === 'WORLD_MAP' && targetCountryPath && !userAnsweredCorrectly) {
        const countryCode = targetCountryPath.getAttribute('id');
        if (countryCode) {
            guessedCountries.set(countryCode.toUpperCase(), { color: '#DC3545', name: payload.correct_answer });
        }
    }
    
    if (payload.correct_answer && !userAnsweredCorrectly) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: linear-gradient(135deg, #B05F66, #A3330D);
            color: white;
            padding: 2rem 3rem;
            border-radius: 1rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 1000;
            text-align: center;
            opacity: 0;
            animation: revealAnswer 0.5s ease-out forwards;
        `;
        overlay.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏰</div>
            <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">Time's Up!</div>
            <div style="font-size: 1rem; margin-bottom: 0.5rem; opacity: 0.9;">The correct answer was:</div>
            <div style="font-size: 2rem; font-weight: bold; margin-top: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${payload.correct_answer}</div>
            <div style="font-size: 1rem; margin-top: 1rem; opacity: 0.8;">Better luck next time! 🍀</div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `@keyframes revealAnswer { to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`;
        document.head.appendChild(style);
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.animation = 'revealAnswer 0.3s ease-in reverse';
            setTimeout(() => overlay.remove(), 300);
        }, 2500);
    }
    updateScores(payload);
}

function gameCompleted(payload) {
    if (currentTimerInterval) {
        clearInterval(currentTimerInterval);
    }
    
    const scores = payload.scores || {};
    const userScore = scores[username] || 0;
    const totalRounds = payload.total_rounds || 10;
    const correctAnswers = Math.floor(userScore / 25);
    const wrongAnswers = totalRounds - correctAnswers;
    
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const userRank = sortedScores.findIndex(([player]) => player === username) + 1;
    
    const gameContainer = document.querySelector('.game-container');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(98, 110, 87, 0.95), rgba(74, 92, 72, 0.95));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        animation: fadeIn 0.5s ease-out forwards;
    `;
    
    overlay.innerHTML = `
        <div style="background: linear-gradient(135deg, #D1BE9D, #BDA77F); padding: 3rem; border-radius: 1.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.4); max-width: 600px; width: 90%; text-align: center; transform: scale(0.8); animation: scaleIn 0.5s ease-out 0.2s forwards;">
            <div style="font-size: 4rem; margin-bottom: 1rem; animation: bounce 1s ease-out 0.5s;">🏆</div>
            <h2 style="font-size: 2.5rem; color: #102E29; margin-bottom: 1rem; font-weight: bold;">Game Over!</h2>
            
            <div style="background: rgba(98, 110, 87, 0.2); padding: 2rem; border-radius: 1rem; margin: 2rem 0;">
                <div style="font-size: 1.2rem; color: #4A5C48; margin-bottom: 0.5rem;">Your Score</div>
                <div style="font-size: 3.5rem; font-weight: bold; color: #626E57; margin-bottom: 1rem;">${userScore}</div>
                <div style="font-size: 1.1rem; color: #4A5C48; margin-bottom: 0.5rem;">Rank: ${userRank}${userRank === 1 ? 'st' : userRank === 2 ? 'nd' : userRank === 3 ? 'rd' : 'th'}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0;">
                <div style="background: linear-gradient(135deg, #82A775, #6B8B68); padding: 1.5rem; border-radius: 1rem; color: white;">
                    <div style="font-size: 2.5rem; font-weight: bold;">${correctAnswers}</div>
                    <div style="font-size: 1rem; opacity: 0.9;">✅ Correct</div>
                </div>
                <div style="background: linear-gradient(135deg, #B05F66, #A3330D); padding: 1.5rem; border-radius: 1rem; color: white;">
                    <div style="font-size: 2.5rem; font-weight: bold;">${wrongAnswers}</div>
                    <div style="font-size: 1rem; opacity: 0.9;">❌ Wrong</div>
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <button onclick="playAgain()" class="btn btn--primary btn--lg" style="font-size: 1.2rem; padding: 1rem 2rem; margin-right: 1rem;">Play Again</button>
                <button onclick="location.href='/lobby'" class="btn btn--secondary btn--lg" style="font-size: 1.2rem; padding: 1rem 2rem;">Back to Lobby</button>
            </div>
            <div style="margin-top: 1.5rem; font-size: 0.9rem; color: #4A5C48; opacity: 0.7;">Redirecting to lobby in <span id="countdown">5</span>s...</div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            to { transform: scale(1); }
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(overlay);
    
    let countdown = 5;
    const countdownEl = document.getElementById('countdown');
    const redirectTimer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(redirectTimer);
            location.href = '/lobby';
        }
    }, 1000);
    
    window.playAgain = function() {
        clearInterval(redirectTimer);
        const rounds = params.get('rounds') || '10';
        location.href = `/game?room=${roomCode}&username=${username}&mode=${gameMode}&type=${roomType}&rounds=${rounds}`;
    };
}

function showWaitingRoom(payload) {
    if (roomType === 'SINGLE') return;
    
    let waitingRoom = document.getElementById('waitingRoom');
    if (!waitingRoom) {
        waitingRoom = document.createElement('div');
        waitingRoom.id = 'waitingRoom';
        waitingRoom.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #D9C18A 0%, #A89A73 47%, #626E57 100%); display: flex; align-items: center; justify-content: center; z-index: 999;`;
        document.body.appendChild(waitingRoom);
    }
    
    const players = payload.players || [];
    const canStart = players.length >= 2;
    
    waitingRoom.innerHTML = `
        <div style="background: var(--bg-primary); padding: 3rem; border-radius: 1.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 600px; width: 90%; text-align: center;">
            <h2 style="font-size: 2.5rem; color: var(--text-primary); margin-bottom: 1rem;">🎮 Waiting Room</h2>
            <div style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: 2rem;">Room: <span style="font-weight: bold; color: var(--primary-600);">${roomCode}</span></div>
            <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">👥 Players (${players.length}/6)</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${players.map((p, i) => `<div style="background: var(--bg-primary); padding: 1rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem;"><span>${i === 0 ? '👑' : '👤'}</span><span style="font-weight: ${p === username ? 'bold' : 'normal'};">${p}</span>${p === username ? '<span style="margin-left: auto; color: var(--success-500);">(You)</span>' : ''}</div>`).join('')}
                </div>
            </div>
            ${!canStart ? `<div style="color: var(--text-secondary); margin-bottom: 1.5rem;">⏳ Waiting for ${2 - players.length} more player${2 - players.length > 1 ? 's' : ''}...</div>` : ''}
            <button onclick="startMultiplayerGame()" class="btn btn--primary btn--lg" style="font-size: 1.2rem; padding: 1rem 2rem; ${!canStart ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!canStart ? 'disabled' : ''}>🚀 Start Game</button>
            <div style="margin-top: 1.5rem;"><button onclick="location.href='/lobby'" class="btn btn--secondary">Leave Room</button></div>
        </div>
    `;
}

function hideWaitingRoom() {
    const waitingRoom = document.getElementById('waitingRoom');
    if (waitingRoom) waitingRoom.remove();
}

window.startMultiplayerGame = function() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'start_game' }));
    }
};

function addChatMessage(payload) {
    const chatMessages = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'chat-message animate-fade-in';
    msg.innerHTML = `<strong>${payload.player_name}:</strong> ${payload.message}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (chatMessages.children.length > 20) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value.trim();
        if (message) {
            ws.send(JSON.stringify({
                type: 'chat_message',
                payload: { message }
            }));
            e.target.value = '';
        }
    }
});

document.addEventListener('keypress', (e) => {
    const answerInput = document.getElementById('answerInput');
    if (e.key === 'Enter' && answerInput && document.activeElement === answerInput) {
        e.preventDefault();
        if (answerInput.getAttribute('data-valid') === 'true') {
            submitAnswer();
        } else {
            answerInput.style.animation = 'shake 0.3s';
            setTimeout(() => answerInput.style.animation = '', 300);
        }
    }
});

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(shakeStyle);

document.addEventListener('input', (e) => {
    if (e.target.id === 'answerInput' && !e.target.disabled) {
        const value = e.target.value.trim();
        if (value.length >= 3 && Object.keys(worldData).length > 0) {
            const matched = Object.entries(worldData).find(([code, name]) => 
                name.toLowerCase() === value.toLowerCase()
            );
            if (matched) {
                e.target.setAttribute('data-valid', 'true');
                setTimeout(() => submitAnswer(), 100);
            } else {
                e.target.removeAttribute('data-valid');
            }
        }
    }
});

let currentZoom = 1;
let currentPan = { x: 0, y: 0 };
let targetCountryPath = null;
let svgDoc = null;
let svgElement = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

function showWorldMap(countryCode, countryName, timeLimit) {
    const questionArea = document.querySelector('.question-area');
    questionArea.style.position = 'relative';
    questionArea.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <h3 style="margin-bottom: var(--space-4); color: var(--text-primary);">What country is highlighted?</h3>
            <div style="display: flex; gap: var(--space-2); justify-content: center; margin-bottom: var(--space-3);">
                <button onclick="window.zoomIn()" class="btn btn--secondary btn--sm">🔍 Zoom In</button>
                <button onclick="window.zoomOut()" class="btn btn--secondary btn--sm">🔍 Zoom Out</button>
                <button onclick="window.resetZoom()" class="btn btn--secondary btn--sm">↺ Reset View</button>
            </div>
            <div id="mapContainer" style="background: #D1BE9D; border-radius: var(--radius-md); max-width: 900px; margin: 0 auto; overflow: hidden; position: relative; height: 500px; cursor: grab; z-index: 1;">
                <div id="mapWrapper" style="width: 100%; height: 100%; transform-origin: center center; transition: transform 0.3s ease;"></div>
            </div>
            <div class="answer-input" style="margin-top: var(--space-4);">
                <input type="text" id="answerInput" class="form-input" placeholder="Type country name..." autocomplete="off">
            </div>
        </div>
    `;
    
    fetch('/static/world.svg')
        .then(r => r.text())
        .then(svgText => {
            const wrapper = document.getElementById('mapWrapper');
            wrapper.innerHTML = svgText;
            
            svgElement = wrapper.querySelector('svg');
            if (svgElement) {
                const originalViewBox = svgElement.getAttribute('viewBox') || '0 0 2000 1000';
                svgElement.setAttribute('viewBox', originalViewBox);
                svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';
                svgElement.style.display = 'block';
                svgElement.style.background = 'transparent';
                
                const paths = svgElement.querySelectorAll('path, g[id]');
                let targetFound = false;
                
                paths.forEach(path => {
                    const id = path.getAttribute('id');
                    if (id && id.toUpperCase() === countryCode.toUpperCase()) {
                        targetCountryPath = path;
                        targetFound = true;
                        path.style.fill = '#82A775';
                        path.style.stroke = '#6B8B68';
                        path.style.strokeWidth = '2';
                        path.style.transition = 'fill 0.3s';
                        
                        setTimeout(() => {
                            try {
                                const bbox = path.getBBox();
                                const container = document.getElementById('mapContainer');
                                const svgViewBox = svgElement.viewBox.baseVal;
                                
                                const countryArea = bbox.width * bbox.height;
                                const svgArea = svgViewBox.width * svgViewBox.height;
                                const areaRatio = countryArea / svgArea;
                                
                                if (areaRatio < 0.0001) {
                                    currentZoom = 10;
                                } else if (areaRatio < 0.0005) {
                                    currentZoom = 7;
                                } else if (areaRatio < 0.001) {
                                    currentZoom = 5;
                                } else if (areaRatio < 0.005) {
                                    currentZoom = 4;
                                } else if (areaRatio < 0.01) {
                                    currentZoom = 3;
                                } else if (areaRatio < 0.05) {
                                    currentZoom = 2;
                                } else {
                                    currentZoom = 1.3;
                                }
                                
                                currentPan.x = 0;
                                currentPan.y = 0;
                                updateMapTransform();
                                
                                setTimeout(() => {
                                    const pathRect = path.getBoundingClientRect();
                                    const containerRect = container.getBoundingClientRect();
                                    
                                    const pathCenterX = pathRect.left + pathRect.width / 2 - containerRect.left;
                                    const pathCenterY = pathRect.top + pathRect.height / 2 - containerRect.top;
                                    
                                    const containerCenterX = containerRect.width / 2;
                                    const containerCenterY = containerRect.height / 2;
                                    
                                    currentPan.x = containerCenterX - pathCenterX;
                                    currentPan.y = containerCenterY - pathCenterY;
                                    
                                    updateMapTransform();
                                }, 100);
                            } catch (e) {
                                console.error('Error centering country:', e);
                            }
                        }, 200);
                    } else {
                        const pathId = id ? id.toUpperCase() : null;
                        if (pathId && guessedCountries.has(pathId)) {
                            const countryData = guessedCountries.get(pathId);
                            path.style.fill = countryData.color;
                            path.style.stroke = '#64513B';
                            path.style.strokeWidth = '1';
                        } else {
                            path.style.fill = '#626E57';
                            path.style.stroke = '#4A5C48';
                            path.style.strokeWidth = '0.5';
                        }
                    }
                });
                
                if (!targetFound) {
                    console.warn('Country not found:', countryCode);
                }
                
                setupMapInteraction();
            }
            
            const answerInput = document.getElementById('answerInput');
            if (answerInput) answerInput.focus();
            
            setTimeout(() => startTimer(timeLimit), 500);
        })
        .catch(e => console.error('Failed to load SVG:', e));
}

function setupMapInteraction() {
    const wrapper = document.getElementById('mapWrapper');
    const container = document.getElementById('mapContainer');
    
    if (!wrapper || !container) return;
    
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        currentZoom = Math.min(Math.max(currentZoom * delta, 0.5), 16);
        updateMapTransform();
    });
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStart = { x: e.clientX - currentPan.x, y: e.clientY - currentPan.y };
        container.style.cursor = 'grabbing';
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentPan.x = e.clientX - dragStart.x;
        currentPan.y = e.clientY - dragStart.y;
        updateMapTransform();
    });
    
    container.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseleave', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
}

function updateMapTransform() {
    const wrapper = document.getElementById('mapWrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${currentPan.x}px, ${currentPan.y}px) scale(${currentZoom})`;
    }
}

window.zoomIn = function() {
    currentZoom = Math.min(currentZoom * 1.3, 16);
    updateMapTransform();
}

window.zoomOut = function() {
    currentZoom = Math.max(currentZoom / 1.3, 0.5);
    updateMapTransform();
}

window.resetZoom = function() {
    currentZoom = 1;
    currentPan = { x: 0, y: 0 };
    updateMapTransform();
}

if (roomType === 'SINGLE') {
    setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'start_game' }));
        }
    }, 1000);
}

connectWebSocket();
