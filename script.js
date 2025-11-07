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

  // ===== TARIKH (DATE PICKER) =====
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
          <thead><tr><th>Bil</th><th>Pasukan</th><th>Markah</th><th>Kedudukan</th><th>Catatan</th></tr></thead>
          <tbody id="event-${e}-body"></tbody>
        </table>`;
      events.appendChild(el);
      populateEventRows(e);
    });

    document.querySelectorAll('.editable-title').forEach(el => {
      el.addEventListener('input', () => {
        const idx = el.dataset.index;
        eventsData[idx].name = el.innerText.trim() || `Acara ${parseInt(idx) + 1}`;
        saveData();
      });
    });
  }

  // ===== CIPTA BARIS PASUKAN =====
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

    // Auto update bila ubah markah
    tbody.querySelectorAll('.score').forEach(inp => {
      inp.addEventListener('input', () => {
        calculateAll();
        saveData();
      });
    });

    tbody.querySelectorAll('.teamName, .note').forEach(inp => {
      inp.addEventListener('input', saveData);
    });
  }

  // ===== SIMPAN & MUAT SEMULA DATA =====
  function saveData() {
    const allScores = {};
    document.querySelectorAll('.score').forEach(inp => {
      const e = inp.dataset.event;
      const t = inp.dataset.team;
      if (!allScores[e]) allScores[e] = {};
      allScores[e][t] = inp.value;
    });

    const allNames = {};
    document.querySelectorAll('.teamName').forEach(inp => {
      const t = inp.dataset.team;
      allNames[t] = inp.value;
    });

    const allNotes = {};
    document.querySelectorAll('.note').forEach(inp => {
      const e = inp.dataset.event;
      const t = inp.dataset.team;
      if (!allNotes[e]) allNotes[e] = {};
      allNotes[e][t] = inp.value;
    });

    localStorage.setItem('eventsData', JSON.stringify(eventsData));
    localStorage.setItem('teamCount', teamCount);
    localStorage.setItem('scores', JSON.stringify(allScores));
    localStorage.setItem('teamNames', JSON.stringify(allNames));
    localStorage.setItem('notes', JSON.stringify(allNotes));
    localStorage.setItem('eventDate', document.getElementById('eventDate').value);
  }

  function loadData() {
    const savedScores = JSON.parse(localStorage.getItem('scores')) || {};
    const savedNames = JSON.parse(localStorage.getItem('teamNames')) || {};
    const savedNotes = JSON.parse(localStorage.getItem('notes')) || {};

    document.querySelectorAll('.teamName').forEach(inp => {
      const t = inp.dataset.team;
      if (savedNames[t]) inp.value = savedNames[t];
    });

    document.querySelectorAll('.score').forEach(inp => {
      const e = inp.dataset.event;
      const t = inp.dataset.team;
      if (savedScores[e] && savedScores[e][t] !== undefined) {
        inp.value = savedScores[e][t];
      }
    });

    document.querySelectorAll('.note').forEach(inp => {
      const e = inp.dataset.event;
      const t = inp.dataset.team;
      if (savedNotes[e] && savedNotes[e][t]) {
        inp.value = savedNotes[e][t];
      }
    });

    calculateAll();
  }

  // ===== BUTANG TAMBAH ACARA =====
  document.getElementById('addEvent').addEventListener('click', () => {
    const newIndex = eventsData.length + 1;
    eventsData.push({ name: `Acara ${newIndex}` });
    createEventsContainer();
    loadData();
    renderTeamSummary();
    saveData();
  });

  // ===== BUTANG SET BIL. PASUKAN =====
  document.getElementById('applyCount').addEventListener('click', () => {
    const v = parseInt(document.getElementById('teamCount').value, 10);
    if (!v || v < 2) {
      alert('Sila masukkan bilangan pasukan minimum 2');
      return;
    }
    teamCount = v;
    createEventsContainer();
    loadData();
    renderTeamSummary();
    saveData();
  });

  // ===== KIRA JUMLAH =====
  function computeTotals() {
    const totals = {};
    for (let i = 1; i <= teamCount; i++) totals[i] = 0;
    document.querySelectorAll('.score').forEach(inp => {
      const t = parseInt(inp.dataset.team, 10);
      const v = parseFloat(inp.value) || 0;
      totals[t] = (totals[t] || 0) + v;
    });
    return totals;
  }

  function getRankForTeam(teamIndex, totalsObj) {
    const arr = Object.keys(totalsObj).map(k => ({ team: parseInt(k, 10), val: totalsObj[k] }));
    arr.sort((a, b) => b.val - a.val);
    const pos = arr.findIndex(x => x.team === teamIndex) + 1;
    return pos === 1 ? `#${pos} (Juara)` : `#${pos}`;
  }

  function calculateAll() {
    for (let e = 1; e <= eventsData.length; e++) {
      const scores = [];
      for (let t = 1; t <= teamCount; t++) {
        const inp = document.querySelector(`.score[data-event='${e}'][data-team='${t}']`);
        const val = parseFloat(inp.value) || 0;
        scores.push({ team: t, val });
      }
      scores.sort((a, b) => b.val - a.val);
      for (let i = 0; i < scores.length; i++) {
        const pos = i + 1;
        const team = scores[i].team;
        const posInput = document.querySelector(`.position[data-event='${e}'][data-team='${team}']`);
        posInput.value = `#${pos}` + (pos === 1 ? " (Juara)" : "");
      }
    }
    renderTeamSummary();
  }

  // ===== RINGKASAN PASUKAN =====
  function renderTeamSummary() {
    const container = document.getElementById('teamsList');
    container.innerHTML = '';
    const totals = computeTotals();
    for (let i = 1; i <= teamCount; i++) {
      const name = document.querySelector(`.teamName[data-team='${i}']`)?.value || `Pasukan ${i}`;
      const total = totals[i] || 0;
      const div = document.createElement('div');
      div.className = 'team-card';
      div.innerHTML = `<div><strong>${name}</strong><div class="muted">Jumlah Markah: ${total.toFixed(1)}</div></div><div><strong>${getRankForTeam(i, totals)}</strong></div>`;
      container.appendChild(div);
    }
    saveData();
  }

  // ===== BUTANG KIRA JUMLAH =====
  document.getElementById('calculate').addEventListener('click', () => {
    calculateAll();
    alert("Markah & kedudukan telah dikira!");
  });
  
// ===== CETAK LAPORAN (VERSI LENGKAP DENGAN ACARA) =====
document.getElementById('printBtn').addEventListener('click', () => {
  calculateAll();
  const totals = computeTotals();
  const date = dateInput.value ? new Date(dateInput.value).toLocaleDateString('ms-MY') : '—';

  // Senarai nama acara
  const eventNames = eventsData.map(e => e.name);

  // Buat baris markah setiap pasukan
  const rowsHTML = [];
  for (let i = 1; i <= teamCount; i++) {
    const name = document.querySelector(`.teamName[data-team='${i}']`)?.value || `Pasukan ${i}`;
    const scores = eventNames.map((_, idx) => {
      const e = idx + 1;
      const val = parseFloat(document.querySelector(`.score[data-event='${e}'][data-team='${i}']`)?.value) || 0;
      return `<td>${val.toFixed(1)}</td>`;
    }).join('');
    const total = totals[i] || 0;
    const rank = getRankForTeam(i, totals);
    rowsHTML.push(`<tr><td>${i}</td><td>${name}</td>${scores}<td><strong>${total.toFixed(1)}</strong></td><td>${rank}</td></tr>`);
  }

  // Hasilkan HTML laporan
  const laporanHTML = `
  <html><head><title>Laporan Pemarkahan — MPKS</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 20mm; color: #000; }
    .header { text-align: center; }
    .header img { width: 80px; height: 80px; margin-bottom: 10px; }
    .header h2 { margin: 0; text-transform: uppercase; font-size: 20px; }
    .header h3 { margin: 0; font-size: 16px; font-weight: normal; }
    .header p { margin: 6px 0 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
    th, td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
    th { background: #f2f2f2; }
    .footer { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature { text-align: center; width: 40%; }
    .signature-line { margin-top: 60px; border-top: 1px solid #000; }
  </style></head><body>
  <div class="header">
    <img src="logo-mpks.png">
    <h2>Laporan Pemarkahan Aktiviti Team Building</h2>
    <h3>Unit Perundangan Majlis Perbandaran Kuala Selangor</h3>
    <p>Tarikh: ${date}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th rowspan="2">Bil</th>
        <th rowspan="2">Nama Pasukan</th>
        <th colspan="${eventNames.length}">Markah Mengikut Acara</th>
        <th rowspan="2">Jumlah</th>
        <th rowspan="2">Kedudukan</th>
      </tr>
      <tr>
        ${eventNames.map((n, i) => `<th>${n}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${rowsHTML.join('')}</tbody>
  </table>

  <div class="footer">
    <div class="signature">
      <div class="signature-line"></div>
      <p><strong>Disediakan oleh</strong></p>
    </div>
    <div class="signature">
      <div class="signature-line"></div>
      <p><strong>Disahkan oleh</strong></p>
    </div>
  </div>
  </body></html>`;

const w = window.open('', 'laporan-' + Date.now());
  w.document.write(laporanHTML);
  w.document.close();
  w.focus();
  w.print();
  w.onafterprint = () => w.close();
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
