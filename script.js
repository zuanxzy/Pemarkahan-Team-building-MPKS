window.addEventListener("DOMContentLoaded", () => {
  // ===== DATA & KONFIGURASI =====
  let eventsData = JSON.parse(localStorage.getItem('eventsData')) || [
    { name: 'Acara 1' }, { name: 'Acara 2' }, { name: 'Acara 3' },
    { name: 'Acara 4' }, { name: 'Acara 5' }, { name: 'Acara 6' }
  ];
  let teamCount = parseInt(localStorage.getItem('teamCount')) || 2;
  let savedDate = localStorage.getItem('eventDate') || '';

  // ===== TARIKH =====
  const dateInput = document.getElementById('eventDate');
  if (savedDate) dateInput.value = savedDate;
  dateInput.addEventListener('change', () => {
    localStorage.setItem('eventDate', dateInput.value);
  });

  // ===== CIPTA PAPARAN ACARA (DENGAN TABLE-CONTAINER) =====
  function createEventsContainer() {
    const events = document.getElementById('events');
    events.innerHTML = '';

    eventsData.forEach((event, index) => {
      const e = index + 1;
      const el = document.createElement('div');
      el.className = 'event card';
      el.innerHTML = `
        <h3 contenteditable="true" class="editable-title" data-index="${index}">
          ${event.name}
        </h3>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Bil</th>
                <th>Pasukan</th>
                <th>Markah</th>
                <th>Kedudukan</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody id="event-${e}-body"></tbody>
          </table>
        </div>`;
      events.appendChild(el);
      populateEventRows(e);
    });

    // Nama acara boleh edit
    document.querySelectorAll('.editable-title').forEach(el => {
      el.addEventListener('blur', () => {
        const idx = el.dataset.index;
        eventsData[idx].name = el.innerText.trim() || `Acara ${parseInt(idx) + 1}`;
        saveData();
      });
    });
  }

  // ===== BARIS PASUKAN =====
  function populateEventRows(eventNum) {
    const tbody = document.getElementById(`event-${eventNum}-body`);
    tbody.innerHTML = '';
    for (let i = 1; i <= teamCount; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i}</td>
        <td><input type="text" class="teamName" data-team="${i}" value="Pasukan ${i}" style="width:100%"></td>
        <td><input type="number" min="0" step="0.1" class="score" data-event="${eventNum}" data-team="${i}" value="0" style="width:100%"></td>
        <td><input type="text" class="position" data-event="${eventNum}" data-team="${i}" readonly style="width:100%"></td>
        <td><input type="text" class="note" data-event="${eventNum}" data-team="${i}" placeholder="Catatan" style="width:100%"></td>`;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('.score').forEach(inp => {
      inp.addEventListener('input', () => {
        calculateAll();
        saveData();
      });
    });
    tbody.querySelectorAll('.teamName, .note').forEach(inp => inp.addEventListener('input', saveData));
  }

  // ===== SIMPAN / MUAT =====
  function saveData() {
    const allScores = {}, allNames = {}, allNotes = {};
    document.querySelectorAll('.score').forEach(inp => {
      const e = inp.dataset.event, t = inp.dataset.team;
      if (!allScores[e]) allScores[e] = {};
      allScores[e][t] = inp.value;
    });
    document.querySelectorAll('.teamName').forEach(inp => allNames[inp.dataset.team] = inp.value);
    document.querySelectorAll('.note').forEach(inp => {
      const e = inp.dataset.event, t = inp.dataset.team;
      if (!allNotes[e]) allNotes[e] = {};
      allNotes[e][t] = inp.value;
    });
    localStorage.setItem('eventsData', JSON.stringify(eventsData));
    localStorage.setItem('teamCount', teamCount);
    localStorage.setItem('scores', JSON.stringify(allScores));
    localStorage.setItem('teamNames', JSON.stringify(allNames));
    localStorage.setItem('notes', JSON.stringify(allNotes));
    localStorage.setItem('eventDate', dateInput.value);
  }

  function loadData() {
    const savedScores = JSON.parse(localStorage.getItem('scores')) || {};
    const savedNames = JSON.parse(localStorage.getItem('teamNames')) || {};
    const savedNotes = JSON.parse(localStorage.getItem('notes')) || {};

    document.querySelectorAll('.teamName').forEach(inp => {
      if (savedNames[inp.dataset.team]) inp.value = savedNames[inp.dataset.team];
    });
    document.querySelectorAll('.score').forEach(inp => {
      const e = inp.dataset.event, t = inp.dataset.team;
      if (savedScores[e] && savedScores[e][t] !== undefined) inp.value = savedScores[e][t];
    });
    document.querySelectorAll('.note').forEach(inp => {
      const e = inp.dataset.event, t = inp.dataset.team;
      if (savedNotes[e] && savedNotes[e][t]) inp.value = savedNotes[e][t];
    });

    calculateAll();
  }

  // ===== TAMBAH / KURANG ACARA =====
  document.getElementById('addEvent').addEventListener('click', () => {
    eventsData.push({ name: `Acara ${eventsData.length + 1}` });
    createEventsContainer(); loadData(); renderTeamSummary(); saveData();
  });

  document.getElementById('removeEvent').addEventListener('click', () => {
    if (eventsData.length <= 1) return alert('Tidak boleh padam — sekurang-kurangnya mesti ada satu acara.');
    if (confirm(`Padam "${eventsData[eventsData.length - 1].name}" ?`)) {
      eventsData.pop();
      createEventsContainer(); loadData(); renderTeamSummary(); saveData();
    }
  });

  // ===== BIL PASUKAN =====
  document.getElementById('applyCount').addEventListener('click', () => {
    const v = parseInt(document.getElementById('teamCount').value, 10);
    if (!v || v < 2 || v > 20) return alert('Sila masukkan bilangan pasukan antara 2 hingga 20');
    teamCount = v;
    createEventsContainer(); loadData(); renderTeamSummary(); saveData();
  });

  // ===== PENGIRAAN =====
  function computeTotals() {
    const totals = {};
    for (let i = 1; i <= teamCount; i++) totals[i] = 0;
    document.querySelectorAll('.score').forEach(inp => {
      const t = +inp.dataset.team, v = parseFloat(inp.value) || 0;
      totals[t] += v;
    });
    return totals;
  }

  function getRankForTeam(teamIndex, totalsObj) {
    const arr = Object.keys(totalsObj).map(k => ({ team: +k, val: totalsObj[k] }))
      .sort((a, b) => b.val - a.val);
    const pos = arr.findIndex(x => x.team === teamIndex) + 1;
    return pos === 1 ? `#${pos} (Juara)` : `#${pos}`;
  }

  function calculateAll() {
    for (let e = 1; e <= eventsData.length; e++) {
      const scores = [];
      for (let t = 1; t <= teamCount; t++) {
        const val = parseFloat(document.querySelector(`.score[data-event='${e}'][data-team='${t}']`)?.value) || 0;
        scores.push({ team: t, val });
      }
      scores.sort((a, b) => b.val - a.val);
      scores.forEach((s, i) => {
        const posInput = document.querySelector(`.position[data-event='${e}'][data-team='${s.team}']`);
        if (posInput) posInput.value = `#${i + 1}` + (i === 0 ? " (Juara)" : "");
      });
    }
    renderTeamSummary();
  }

  // ===== RINGKASAN PASUKAN =====
  function renderTeamSummary() {
    const container = document.getElementById('teamsList');
    container.innerHTML = '';
    const totals = computeTotals();
    const ranked = Object.keys(totals).map(t => ({ team: +t, total: totals[t] }))
      .sort((a, b) => b.total - a.total || a.team - b.team);

    ranked.forEach((r, idx) => {
      const name = document.querySelector(`.teamName[data-team='${r.team}']`)?.value || `Pasukan ${r.team}`;
      const div = document.createElement('div');
      div.className = 'team-card';
      const rankText = idx === 0 ? `Juara` : idx === 1 ? `Naib Juara` : idx === 2 ? `Ketiga` : `Kedudukan ${idx + 1}`;
      div.innerHTML = `
        <div><strong>${name}</strong></div>
        <div class="muted">Jumlah: <strong>${r.total.toFixed(1)}</strong></div>
        <div style="margin-top:4px; color:#50c878; font-weight:600;">${rankText}</div>`;
      container.appendChild(div);
    });
    saveData();
  }

  // ===== CETAK (BUKA LAPORAN CANTIK) =====
  function openPrintReport() {
    calculateAll();
    const totals = computeTotals();
    const date = dateInput.value ? new Date(dateInput.value).toLocaleDateString('ms-MY') : '—';

    let html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laporan Pemarkahan Team Building</title>
      <style>
        body { font-family: "Times New Roman", serif; margin: 15mm; color: #000; line-height: 1.5; font-size: 14px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header img { width: 70px; height: 70px; }
        h1 { margin: 8px 0; font-size: 1.4rem; }
        h2 { margin: 20px 0 8px; border-bottom: 1.5px solid #000; padding-bottom: 4px; font-size: 1.1rem; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: center; }
        th { background: #f0f0f0; font-weight: bold; }
        .team-summary { page-break-inside: avoid; margin-bottom: 25px; }
        .print-btn { display: block; width: 100%; max-width: 260px; margin: 25px auto; padding: 12px; background: #0d9488; color: white; text-align: center; font-weight: bold; border-radius: 8px; text-decoration: none; font-size: 16px; }
        .footer { text-align: center; margin-top: 40px; font-size: 0.8rem; color: #555; }
        @media print { 
          .print-btn { display: none; } 
          body { margin: 10mm; }
        }
        @media (max-width: 600px) {
          body { margin: 10mm; font-size: 12px; }
          table { font-size: 11px; }
          th, td { padding: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="logo-mpks.png" alt="MPKS">
        <h1>Laporan Pemarkahan Team Building</h1>
        <p>Unit Perundangan MPKS</p>
        <p><strong>Tarikh Acara:</strong> ${date}</p>
      </div>`;

    // Ringkasan keseluruhan
    html += `<h2>Ringkasan Kedudukan Akhir</h2>
      <table><tr><th>Kedudukan</th><th>Pasukan</th><th>Jumlah Markah</th></tr>`;
    const ranked = Object.keys(totals).map(t => ({ team: +t, total: totals[t] }))
      .sort((a, b) => b.total - a.total || a.team - b.team);
    ranked.forEach((r, i) => {
      const name = document.querySelector(`.teamName[data-team='${r.team}']`)?.value || `Pasukan ${r.team}`;
      const rank = i === 0 ? 'Juara' : i === 1 ? 'Naib Juara' : i === 2 ? 'Tempat Ketiga' : `Kedudukan ${i + 1}`;
      html += `<tr><td><strong>${rank}</strong></td><td>${name}</td><td><strong>${r.total.toFixed(1)}</strong></td></tr>`;
    });
    html += `</table>`;

    // Butiran setiap pasukan
    for (let i = 1; i <= teamCount; i++) {
      const name = document.querySelector(`.teamName[data-team='${i}']`)?.value || `Pasukan ${i}`;
      html += `<div class="team-summary">
        <h2>${name} — Jumlah: ${totals[i].toFixed(1)} (${getRankForTeam(i, totals)})</h2>
        <table>
          <tr><th>Bil</th><th>Acara</th><th>Markah</th><th>Kedudukan</th><th>Catatan</th></tr>`;
      for (let e = 0; e < eventsData.length; e++) {
        const eventId = e + 1;
        const score = parseFloat(document.querySelector(`.score[data-event='${eventId}'][data-team='${i}']`)?.value) || 0;
        const pos = document.querySelector(`.position[data-event='${eventId}'][data-team='${i}']`)?.value || '-';
        const note = document.querySelector(`.note[data-event='${eventId}'][data-team='${i}']`)?.value || '';
        html += `<tr><td>${e + 1}</td><td>${eventsData[e].name}</td><td>${score.toFixed(1)}</td><td>${pos}</td><td>${note}</td></tr>`;
      }
      html += `</table></div>`;
    }

    html += `<a href="javascript:window.print()" class="print-btn">Cetak / Simpan sebagai PDF</a>
      <div class="footer">Dicetak pada: ${new Date().toLocaleString('ms-MY')}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }

  // Pasang event pada KEDUA-DUA butang cetak
  document.querySelectorAll('#printBtn, #printBtnSummary').forEach(btn => {
    btn.addEventListener('click', openPrintReport);
  });

  // ===== RESET =====
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Padam semua data?')) {
      localStorage.clear();
      location.reload();
    }
  });

  // ===== MULA =====
  createEventsContainer();
  loadData();
  
});
