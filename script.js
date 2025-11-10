<!doctype html>
<html lang="ms">
<head>
  <link href="https://rsms.me/inter/inter.css" rel="stylesheet">
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Pemarkahan Team Building — MPKS</title>
  <link rel="stylesheet" href="style.css">
  <link rel="manifest" href="manifest.json">
<link rel="icon" href="logo-mpks.png" sizes="192x192">
  <meta name="theme-color" content="#1a1a1a">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">
        <div class="logo">
          <img src="logo-mpks.png" alt="Logo MPKS">
        </div>
        <div>
          <h1>Pemarkahan Aktiviti Team Building — Unit Perundangan MPKS</h1>
          <div class="lead">
            Tarikh:
            <input type="date" id="eventDate" style="padding:5px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:inherit;">
          </div>
        </div>
      </div>

      <div class="controls">
        <label>Bil. Pasukan</label>
        <input id="teamCount" type="number" min="2" max="20" value="2">
        <button id="applyCount" class="btn-outline">Set</button>
        <button id="exportCsv" class="btn-outline">Eksport CSV</button>
        <button id="calculate" class="btn-primary">Kira Jumlah & Kedudukan</button>
        <button id="addEvent" class="btn-success">+ Tambah Acara</button>
        <button id="removeEvent" class="btn-danger">– Kurangkan Acara</button>
        <button id="printBtn" class="btn-outline">Cetak</button>
        <button id="reset" class="btn-danger">Reset</button>
      </div>
    </header>

    <main class="grid">
      <section class="card">
        <div class="title-section">
          <h2>Senarai Acara & Isian Markah</h2>
          <div class="muted">Klik nama acara untuk ubah, dan tekan “+ Tambah Acara” untuk tambah baru.</div>
        </div>

        <div class="events" id="events"></div>

        <div class="bottom-action" style="margin-top:16px; display:flex; gap:10px; align-items:center;">
        </div>
      </section>

      <aside class="card summary">
        <h3>Ringkasan Pasukan</h3>
        <div class="teams-list" id="teamsList"></div>
        <div class="actions">
          <button id="printBtnSummary" class="btn-outline">Cetak</button>
        </div>
      </aside>
    </main>

    <footer class="muted">Auto-simpan aktif — semua data kekal walaupun halaman ditutup.</footer>
  </div>

  <script src="script.js" defer></script>
</body>
</html>
