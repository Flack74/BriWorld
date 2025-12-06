let selectedMode = 'FLAG';
let selectedRoomType = 'SINGLE';
let publicRooms = [];
let selectedPublicRoom = null;

function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function selectRoomType(type) {
    selectedRoomType = type;
    document.querySelectorAll('.room-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    const roomCodeSection = document.getElementById('roomCodeSection');
    const publicRoomsSection = document.getElementById('publicRoomsSection');
    
    if (type === 'PRIVATE') {
        roomCodeSection.style.display = 'block';
        publicRoomsSection.style.display = 'none';
    } else if (type === 'PUBLIC') {
        roomCodeSection.style.display = 'none';
        publicRoomsSection.style.display = 'block';
        loadPublicRooms();
    } else {
        roomCodeSection.style.display = 'none';
        publicRoomsSection.style.display = 'none';
    }
}

function loadPublicRooms() {
    fetch('/api/rooms?type=PUBLIC&mode=' + selectedMode)
        .then(r => r.json())
        .then(data => {
            publicRooms = data.rooms || [];
            displayPublicRooms();
        })
        .catch(e => {
            console.error('Failed to load public rooms:', e);
            displayPublicRooms();
        });
}

function displayPublicRooms() {
    const list = document.getElementById('publicRoomsList');
    if (publicRooms.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: var(--space-4); color: var(--text-secondary);">No public rooms available. Create one!</div>';
        return;
    }
    
    list.innerHTML = publicRooms.map(room => `
        <div onclick="selectPublicRoom('${room.code}')" class="public-room-item ${selectedPublicRoom === room.code ? 'selected' : ''}" style="padding: var(--space-3); margin-bottom: var(--space-2); border: 2px solid ${selectedPublicRoom === room.code ? 'var(--primary-600)' : 'var(--border-primary)'}; border-radius: var(--radius-base); cursor: pointer; transition: all 0.2s; background: ${selectedPublicRoom === room.code ? 'rgba(98, 110, 87, 0.1)' : 'white'};">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: var(--fw-semibold);">Room ${room.code}</div>
                    <div style="font-size: var(--text-sm); color: var(--text-secondary);">${room.players}/${room.max_players} players • ${room.mode === 'FLAG' ? '🚩 Flag' : '🗺️ Map'}</div>
                </div>
                <div style="color: var(--success-500); font-weight: var(--fw-semibold);">${room.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing'}</div>
            </div>
        </div>
    `).join('');
}

function selectPublicRoom(code) {
    selectedPublicRoom = code;
    displayPublicRooms();
}

function createNewPublicRoom() {
    selectedPublicRoom = 'CREATE_NEW';
    startGame();
}

function startGame() {
    const username = document.getElementById('username').value.trim();
    const rounds = document.getElementById('roundsCount').value;
    
    if (!username) {
        alert('Please enter a username');
        return;
    }

    let roomCode;
    if (selectedRoomType === 'SINGLE') {
        roomCode = 'SINGLE_' + generateRoomCode();
    } else if (selectedRoomType === 'PUBLIC') {
        if (selectedPublicRoom === 'CREATE_NEW' || !selectedPublicRoom) {
            roomCode = generateRoomCode();
        } else {
            roomCode = selectedPublicRoom;
        }
    } else {
        const inputCode = document.getElementById('roomCode')?.value.trim();
        roomCode = inputCode || generateRoomCode();
    }

    localStorage.setItem('username', username);
    localStorage.setItem('roomCode', roomCode);
    localStorage.setItem('gameMode', selectedMode);
    localStorage.setItem('roomType', selectedRoomType);
    localStorage.setItem('roundsCount', rounds);
    
    window.location.href = `/game?room=${roomCode}&username=${username}&mode=${selectedMode}&type=${selectedRoomType}&rounds=${rounds}`;
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
