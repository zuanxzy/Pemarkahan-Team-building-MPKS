window.addEventListener("DOMContentLoaded", () => {
  // ===== DATA & KONFIGURASI =====
  let eventsData = JSON.parse(localStorage.getItem('eventsData')) || [
    { name: 'Acara 1' },
    { name: 'Acara 2' },
    { name: 'Acara 3' },
    { name: 'Acara 4' },
    { name: 'Acara 5' },
    { name: 'Acara 6' }
  ];
  let teamCount = parseInt(localStorage.getItem('teamCount')) || 2;
  let savedDate = localStorage.getItem('eventDate') || '';

  // ===== TARIKH =====
  const dateInput = document.getElementById('eventDate');
  if (savedDate) dateInput.value = savedDate;
  dateInput.addEventListener('change', () => {
    localStorage.setItem('eventDate', dateInput.value);
  });

  // ===== CIPTA PAPARAN ACARA =====
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
        <table class="table">
          <thead>
            <tr><th>Bil</th><th>Pasukan</th><th>Markah</th><th>Kedudukan</th><th>Catatan</th></tr>
          </thead>
          <tbody id="event-${e}-body"></tbody>
        </table>`;
      events.appendChild(el);
      populateEventRows(e);
    });

    // Nama acara boleh ubah terus
    document.querySelectorAll('.editable-title').forEach(el => {
      el.addEventListener('input', () => {
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
        <td><input type="text" class="teamName" data-team="${i}" value="Pasukan ${i}"></td>
        <td><input type="number" min="0" step="0.1" class="score" data-event="${eventNum}" data-team="${i}" value="0"></td>
        <td><input type="text" class="position" data-event="${eventNum}" data-team="${i}" readonly></td>
        <td><input type="text" class="note" data-event="${eventNum}" data-team="${i}" placeholder="Catatan"></td>`;
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
      localStorage.setItem('eventsData', JSON.stringify(eventsData)); // simpan perubahan
      createEventsContainer(); loadData(); renderTeamSummary(); saveData();
    }
  });

  // ===== BIL PASUKAN =====
  document.getElementById('applyCount').addEventListener('click', () => {
    const v = parseInt(document.getElementById('teamCount').value, 10);
    if (!v || v < 2) return alert('Sila masukkan bilangan pasukan minimum 2');
    teamCount = v; createEventsContainer(); loadData(); renderTeamSummary(); saveData();
  });

  // ===== PENGIRAAN =====
  function computeTotals() {
    const totals = {}; for (let i = 1; i <= teamCount; i++) totals[i] = 0;
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
        posInput.value = `#${i + 1}` + (i === 0 ? " (Juara)" : "");
      });
    }
    renderTeamSummary();
  }

  // ===== RINGKASAN =====
  function renderTeamSummary() {
    const container = document.getElementById('teamsList');
    container.innerHTML = '';
    const totals = computeTotals();
    for (let i = 1; i <= teamCount; i++) {
      const name = document.querySelector(`.teamName[data-team='${i}']`)?.value || `Pasukan ${i}`;
      const total = totals[i] || 0;
      const div = document.createElement('div');
      div.className = 'team-card';
      div.innerHTML = `<div><strong>${name}</strong><div class="muted">Jumlah Markah: ${total.toFixed(1)}</div></div>
                       <div><strong>${getRankForTeam(i, totals)}</strong></div>`;
      container.appendChild(div);
    }
    saveData();
  }

  // ===== CETAK (VERSI RINGAN UNTUK PHONE) =====
  document.getElementById('printBtn').addEventListener('click', () => {
    calculateAll();
    const totals = computeTotals();
    const date = dateInput.value ? new Date(dateInput.value).toLocaleDateString('ms-MY') : '—';

    let laporanHTML = `
    <html><head><title>Laporan Pemarkahan</title>
    <style>
      body { font-family: "Times New Roman", serif; margin: 20mm; color:#000; }
      .header{text-align:center;} .header img{width:80px;height:80px;}
      table{width:100%;border-collapse:collapse;margin-top:20px;}
      th,td{border:1px solid #000;padding:6px;text-align:center;}
      th{background:#f2f2f2;}
    </style></head><body>
    <div class="header"><img src="logo-mpks.png"><h2>Laporan Pemarkahan</h2><p>Tarikh: ${date}</p></div>`;

    for (let i = 1; i <= teamCount; i++) {
      const name = document.querySelector(`.teamName[data-team='${i}']`)?.value || `Pasukan ${i}`;
      laporanHTML += `<h3>Pasukan: ${name} — <span style="font-weight:normal;">Jumlah Markah: ${totals[i].toFixed(1)} (${getRankForTeam(i, totals)})</span></h3>`;
      laporanHTML += `<table><thead><tr><th>Bil</th><th>Nama Acara</th><th>Markah</th><th>Catatan</th></tr></thead><tbody>`;

      for (let e = 0; e < eventsData.length; e++) {
        const val = parseFloat(document.querySelector(`.score[data-event='${e + 1}'][data-team='${i}']`)?.value) || 0;
        const note = document.querySelector(`.note[data-event='${e + 1}'][data-team='${i}']`)?.value || '';
        laporanHTML += `<tr><td>${e + 1}</td><td>${eventsData[e].name}</td><td>${val.toFixed(1)}</td><td>${note}</td></tr>`;
      }

      laporanHTML += `</tbody></table><br>`;
    }

    laporanHTML += `</body></html>`;

    const printWin = window.open("", "_blank");
    printWin.document.write(laporanHTML);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
      printWin.close();
    }, 600);
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
