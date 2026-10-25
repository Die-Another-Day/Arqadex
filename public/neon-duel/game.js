/* NEON DUEL — Arqadex's first real multiplayer game (v2.6.0).
   Transport: PeerJS Cloud (free public relay, no account, no Arqadex server).
   Room code = 4 letters, host peer id = arqadex-duel-<CODE>.
   The host arbitrates: it sends the signal, measures every hit by arrival
   time on its own clock, and broadcasts results. Guests never trust each
   other's clocks. Practice mode runs the same round engine offline vs a bot.
   Nothing is stored anywhere: scores live in this page only. */
(function () {
  'use strict'

  var $ = function (id) { return document.getElementById(id) }
  var screens = ['lobby', 'room', 'duel', 'results']
  var peer = null, hostConn = null, conns = {}, joinTimer = null
  var role = null // 'host' | 'guest' | 'bot'
  var me = { key: 'me', name: 'YOU' }
  var players = [] // {key, name, isHost}
  var roomCode = '', mode = 'couple'
  var match = null // {round, scores:{}, phase, signalAt, hits, fouled, timers[]}

  function show(screen) {
    screens.forEach(function (s) { $('screen-' + s).classList.toggle('hidden', s !== screen) })
  }
  function setStatus(el, msg) { $(el).textContent = msg || '' }
  function callsign() {
    var v = ($('callsign').value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
    return v || ('PILOT-' + Math.random().toString(36).slice(2, 4).toUpperCase())
  }
  function makeCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ', out = ''
    for (var i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
  }
  function maxPlayers() { return mode === 'couple' ? 2 : 6 }
  function inviteLink() { return location.origin + '/neon-duel/?room=' + roomCode }

  /* ---------- PeerJS loading (CDN may be slow or blocked: fail loudly) ---------- */
  function waitForPeer() {
    return new Promise(function (resolve, reject) {
      var waited = 0
      var timer = setInterval(function () {
        if (typeof window.Peer !== 'undefined') { clearInterval(timer); resolve() }
        else if ((waited += 200) > 10000) { clearInterval(timer); reject(new Error('load')) }
      }, 200)
    })
  }

  /* ---------- shared UI ---------- */
  function renderRoster() {
    $('roster').innerHTML = players.map(function (p) {
      return '<div class="player' + (p.isHost ? ' host' : '') + '"><span>' + esc(p.name) + '</span><span>' +
        (match ? (match.scores[p.key] || 0) + ' WINS' : '') + '</span></div>'
    }).join('')
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  function renderScores() {
    if (!match) return
    var rows = players.slice().sort(function (a, b) { return (match.scores[b.key] || 0) - (match.scores[a.key] || 0) })
    var top = rows.length ? (match.scores[rows[0].key] || 0) : 0
    var html = rows.map(function (p) {
      var s = match.scores[p.key] || 0
      return '<div class="row' + (s === top && s > 0 ? ' leader' : '') + '"><span>' + esc(p.name) + '</span><span>' + s + '</span></div>'
    }).join('')
    $('scoreboard').innerHTML = html
    $('final-scores').innerHTML = html
  }
  function setTarget(state, label) {
    var t = $('target')
    t.className = 'target' + (state === 'live' ? ' live' : state === 'fouled' ? ' fouled' : '')
    t.disabled = state !== 'armed' && state !== 'live'
    t.textContent = label || (state === 'live' ? 'TAP NOW!' : state === 'fouled' ? 'FALSE START — OUT THIS ROUND' : 'WAIT FOR THE FLASH…')
  }

  /* ---------- match engine (host side + bot practice share this) ---------- */
  function newMatch() {
    match = { round: 0, scores: {}, phase: 'idle', signalAt: 0, hits: [], fouled: {}, timers: [] }
    players.forEach(function (p) { match.scores[p.key] = 0 })
  }
  function broadcast(msg) {
    Object.keys(conns).forEach(function (k) { try { conns[k].send(msg) } catch (e) {} })
  }
  function startMatch() {
    newMatch()
    renderScores()
    show('duel')
    if (role === 'host') broadcast({ t: 'match-start', players: players })
    nextRound()
  }
  function nextRound() {
    match.round += 1
    match.phase = 'waiting'
    match.hits = []
    match.fouled = {}
    $('duel-round').textContent = match.round
    $('duel-msg').textContent = 'GET READY…'
    setTarget('armed')
    setStatus('duel-status', '')
    var delay = 1500 + Math.random() * 2000
    match.timers.push(setTimeout(function () {
      if (!match || match.phase !== 'waiting') return
      match.phase = 'live'
      match.signalAt = performance.now()
      $('duel-msg').textContent = 'GO!'
      setTarget('live')
      if (role === 'bot') {
        match.timers.push(setTimeout(function () {
          if (match && match.phase === 'live') recordHit('bot', performance.now() - match.signalAt)
        }, 230 + Math.random() * 200))
      }
      if (role === 'host') broadcast({ t: 'signal', round: match.round })
      match.timers.push(setTimeout(function () { if (match && match.phase === 'live') finishRound() }, 5000))
    }, delay))
  }
  function recordHit(key, ms) {
    if (!match || match.phase !== 'live' || match.fouled[key]) return
    if (match.hits.some(function (h) { return h.key === key })) return
    match.hits.push({ key: key, ms: Math.round(ms) })
    var alive = players.filter(function (p) { return !match.fouled[p.key] }).length
    if (match.hits.length >= alive) finishRound()
  }
  function recordFoul(key) {
    if (!match || match.phase !== 'waiting') return
    match.fouled[key] = true
    if (role === 'host' || role === 'bot') {
      var alive = players.filter(function (p) { return !match.fouled[p.key] }).length
      if (alive === 0) {
        match.timers.forEach(clearTimeout)
        $('duel-msg').textContent = 'EVERYONE JUMPED THE GUN — ROUND REPLAYED'
        if (role === 'host') broadcast({ t: 'round-void', round: match.round })
        match.timers.push(setTimeout(function () { match.round -= 1; nextRound() }, 1800))
      }
    }
  }
  function finishRound() {
    if (!match || match.phase !== 'live') return
    match.phase = 'done'
    match.timers.forEach(clearTimeout)
    match.timers = []
    setTarget('idle', 'ROUND OVER')
    var winner = null
    if (match.hits.length) {
      match.hits.sort(function (a, b) { return a.ms - b.ms })
      winner = match.hits[0]
      match.scores[winner.key] += 1
    }
    renderScores()
    var wName = winner ? players.find(function (p) { return p.key === winner.key }).name : null
    $('duel-msg').textContent = winner ? wName + ' TAKES IT · ' + winner.ms + 'ms' : 'NOBODY TAPPED — NO POINTS'
    if (role === 'host') broadcast({ t: 'round-result', round: match.round, winner: winner, scores: match.scores })
    var leader = players.find(function (p) { return match.scores[p.key] >= 3 })
    match.timers.push(setTimeout(function () {
      if (leader) endMatch(leader)
      else nextRound()
    }, 2000))
  }
  function endMatch(leader) {
    // Render BEFORE nulling match: renderScores reads match.scores, and
    // nulling first threw (results screen never appeared) — the v2.4 lesson
    // again: verify the full flow, not just the happy path.
    renderScores()
    $('winner-name').textContent = leader.name + ' WINS!'
    match = null
    show('results')
    if (role === 'host') broadcast({ t: 'match-end', winner: leader.key, scores: {} })
    if (role === 'guest') { /* host already sent match-end; this is local only for bot */ }
    var rem = $('btn-rematch')
    if (role === 'guest') { rem.disabled = true; rem.textContent = 'WAITING FOR HOST…' }
    else { rem.disabled = false; rem.textContent = 'REMATCH' }
  }

  /* ---------- host ---------- */
  function createRoom() {
    me.name = callsign()
    mode = document.querySelector('input[name="mode"]:checked').value
    roomCode = makeCode()
    setStatus('lobby-status', 'Opening room ' + roomCode + '…')
    waitForPeer().then(function () { hostPeer() }).catch(function () {
      setStatus('lobby-status', 'Could not load the connection library — check your connection and retry. Practice mode still works offline.')
    })
  }
  function hostPeer() {
    peer = new Peer('arqadex-duel-' + roomCode, { debug: 2 })
    peer.on('disconnected', function () { try { peer.reconnect() } catch (e) {} })
    peer.on('open', function () {
      role = 'host'
      players = [{ key: 'host', name: me.name, isHost: true }]
      $('room-code').textContent = roomCode
      $('room-mode').textContent = mode === 'couple' ? 'COUPLES · 2 MAX' : 'GROUP · 6 MAX'
      renderRoster()
      show('room')
      setStatus('room-status', 'Share the invite link — the duel starts when everyone is in.')
      $('btn-start').classList.add('hidden')
    })
    peer.on('connection', function (conn) {
      conn.on('data', function (msg) { onHostData(conn, msg) })
      conn.on('close', function () { onGuestLeft(conn) })
    })
    peer.on('error', function (err) {
      if (err.type === 'unavailable-id') { roomCode = makeCode(); hostPeer() }
      else setStatus('lobby-status', 'Relay error (' + err.type + ') — if this keeps happening, try a different network. The room code may still work for others.')
    })
  }
  function onHostData(conn, msg) {
    if (msg.t === 'hello') {
      if (players.length >= maxPlayers()) { conn.send({ t: 'rejected', reason: 'Room is full.' }); setTimeout(function () { conn.close() }, 300); return }
      var key = conn.peer
      conns[key] = conn
      players.push({ key: key, name: msg.name, isHost: false })
      broadcast({ t: 'roster', players: players })
      renderRoster()
      if (players.length >= 2) $('btn-start').classList.remove('hidden')
    } else if (msg.t === 'hit' && match) {
      recordHit(conn.peer, performance.now() - match.signalAt)
    } else if (msg.t === 'foul' && match) {
      recordFoul(conn.peer)
    } else if (msg.t === 'want-rematch' && match === null) {
      startMatch()
    }
  }
  function onGuestLeft(conn) {
    delete conns[conn.peer]
    players = players.filter(function (p) { return p.key !== conn.peer })
    if (match && players.length < 2) {
      match.timers.forEach(clearTimeout)
      match = null
      broadcast({ t: 'abort', reason: 'A player left — the match was stopped.' })
      show('room')
      setStatus('room-status', 'A player left — the match was stopped.')
    }
    broadcast({ t: 'roster', players: players })
    renderRoster()
    if (players.length < 2) $('btn-start').classList.add('hidden')
  }

  /* ---------- guest ---------- */
  function joinRoom() {
    me.name = callsign()
    var code = ($('join-code').value || '').trim().toUpperCase()
    if (!/^[A-Z]{4}$/.test(code)) { setStatus('lobby-status', 'Enter a 4-letter room code.'); return }
    // A failed earlier attempt leaves a stale peer behind; its pending timers
    // could overwrite the new attempt's status. Clean up first.
    try { if (peer) peer.destroy() } catch (e) {}
    if (joinTimer) { clearTimeout(joinTimer); joinTimer = null }
    roomCode = code
    setStatus('lobby-status', 'Joining room ' + code + '…')
    waitForPeer().then(function () {
      peer = new Peer({ debug: 2 })
      peer.on('disconnected', function () { try { peer.reconnect() } catch (e) {} })
      peer.on('open', function () {
        hostConn = peer.connect('arqadex-duel-' + code, { reliable: true })
        hostConn.on('open', function () { hostConn.send({ t: 'hello', name: me.name }) })
        hostConn.on('data', function (msg) { onGuestData(msg) })
        hostConn.on('close', function () {
          if ($('screen-room').classList.contains('hidden') && $('screen-duel').classList.contains('hidden')) return
          setStatus('lobby-status', 'Lost connection to the host — the room closed.')
          leaveRoom(true)
        })
        joinTimer = setTimeout(function () {
          if (role !== 'guest') setStatus('lobby-status', 'Reached the relay, but the host did not answer within 12s. The host may have closed the room, or this network may block direct connections — retry, or try on a different network.')
        }, 12000)
      })
      peer.on('error', function (err) {
        setStatus('lobby-status', 'Relay error (' + err.type + ') — ' + (err.type === 'peer-unavailable' ? 'no room with that code is open right now.' : 'the host may be offline or this network may block the relay.'))
      })
    }).catch(function () {
      setStatus('lobby-status', 'Could not load the connection library — check your connection and retry.')
    })
  }
  function onGuestData(msg) {
    if (msg.t === 'rejected') { setStatus('lobby-status', msg.reason); leaveRoom(true); return }
    if (msg.t === 'roster') {
      if (joinTimer) { clearTimeout(joinTimer); joinTimer = null }
      players = msg.players
      role = 'guest'
      $('room-code').textContent = roomCode
      $('room-mode').textContent = ''
      renderRoster()
      show('room')
      setStatus('room-status', 'Connected. Waiting for the host to start.')
    } else if (msg.t === 'match-start') {
      players = msg.players
      newMatch()
      renderScores()
      show('duel')
      // guest round engine: host drives phases; local nextRound timers are NOT used.
      match.phase = 'waiting'
      $('duel-round').textContent = 1
      $('duel-msg').textContent = 'GET READY…'
      setTarget('armed')
    } else if (msg.t === 'signal') {
      if (!match) return
      match.phase = 'live'
      match.round = msg.round
      $('duel-round').textContent = msg.round
      $('duel-msg').textContent = 'GO!'
      setTarget('live')
    } else if (msg.t === 'round-result') {
      if (!match) return
      match.phase = 'done'
      match.scores = msg.scores
      setTarget('idle', 'ROUND OVER')
      var w = msg.winner
      $('duel-msg').textContent = w ? players.find(function (p) { return p.key === w.key }).name + ' TAKES IT · ' + w.ms + 'ms' : 'NOBODY TAPPED — NO POINTS'
      renderScores()
    } else if (msg.t === 'round-void') {
      $('duel-msg').textContent = 'EVERYONE JUMPED THE GUN — ROUND REPLAYED'
      setTarget('armed')
    } else if (msg.t === 'match-end') {
      var leader = players.find(function (p) { return p.key === msg.winner })
      match = null
      $('winner-name').textContent = (leader ? leader.name : 'SOMEONE') + ' WINS!'
      show('results')
      var rem = $('btn-rematch')
      rem.disabled = true; rem.textContent = 'WAITING FOR HOST…'
    } else if (msg.t === 'abort') {
      match = null
      show('room')
      setStatus('room-status', msg.reason)
    } else if (msg.t === 'rematch') {
      newMatch()
      renderScores()
      show('duel')
      match.phase = 'waiting'
      $('duel-round').textContent = 1
      $('duel-msg').textContent = 'GET READY…'
      setTarget('armed')
    }
  }

  /* ---------- practice vs bot ---------- */
  function practice() {
    me.name = callsign()
    role = 'bot'
    players = [{ key: 'me', name: me.name, isHost: true }, { key: 'bot', name: 'BOT-9', isHost: false }]
    startMatch()
  }

  /* ---------- target clicks ---------- */
  $('target').addEventListener('click', function () {
    if (!match) return
    if (match.phase === 'waiting') {
      setTarget('fouled')
      if (role === 'host' || role === 'bot') recordFoul(role === 'bot' ? 'me' : 'host')
      else if (role === 'guest') hostConn.send({ t: 'foul' })
    } else if (match.phase === 'live') {
      if (role === 'host') recordHit('host', performance.now() - match.signalAt)
      else if (role === 'bot') recordHit('me', performance.now() - match.signalAt)
      else if (role === 'guest') { hostConn.send({ t: 'hit' }); setTarget('idle', 'HIT SENT — WAITING…') }
      if (role !== 'guest') setTarget('idle', 'HIT!')
    }
  })

  /* ---------- buttons ---------- */
  $('btn-create').addEventListener('click', createRoom)
  $('btn-join').addEventListener('click', joinRoom)
  $('btn-practice').addEventListener('click', practice)
  $('btn-start').addEventListener('click', function () { if (players.length >= 2) startMatch() })
  $('btn-leave').addEventListener('click', function () { leaveRoom(false) })
  $('btn-copy').addEventListener('click', function () {
    var link = inviteLink()
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () {
      setStatus('room-status', 'Invite link copied — send it to your opponent.')
    })
    else {
      var ta = document.createElement('textarea')
      ta.value = link; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
      setStatus('room-status', 'Invite link copied — send it to your opponent.')
    }
  })
  $('btn-rematch').addEventListener('click', function () {
    if (role === 'host') { broadcast({ t: 'rematch' }); startMatch() }
    else if (role === 'bot') { startMatch() }
    else if (role === 'guest') { hostConn.send({ t: 'want-rematch' }) }
  })
  $('btn-lobby').addEventListener('click', function () { leaveRoom(false) })

  function leaveRoom(silent) {
    try { if (hostConn) hostConn.close() } catch (e) {}
    Object.keys(conns).forEach(function (k) { try { conns[k].close() } catch (e) {} })
    try { if (peer) peer.destroy() } catch (e) {}
    peer = null; hostConn = null; conns = {}; role = null; players = []
    if (joinTimer) { clearTimeout(joinTimer); joinTimer = null }
    if (match) { match.timers.forEach(clearTimeout); match = null }
    roomCode = ''
    show('lobby')
    if (!silent) setStatus('lobby-status', '')
  }

  /* ---------- invite links ---------- */
  var params = new URLSearchParams(location.search)
  var invited = (params.get('room') || '').toUpperCase()
  if (/^[A-Z]{4}$/.test(invited)) {
    $('join-code').value = invited
    $('invite-hint').classList.remove('hidden')
  }
})()
