// DATA AWAL SESUAI DOKUMEN RANCANGAN TAHAP 2 (PER 31 OKTOBER 2026)
const INITIAL_STATE = {
  products: [
    { id: "PRD-01", name: "Ketoprak Telur Spesial", category: "Makanan", price: 18000, hpp: 8000, stock: 45, sold: 142, badge: "Terlaris", icon: "🥗" },
    { id: "PRD-02", name: "Es Teh Manis Jumbo", category: "Minuman", price: 4000, hpp: 1500, stock: 80, sold: 210, badge: "Favorit", icon: "🧊" },
    { id: "PRD-03", name: "Ketoprak Biasa (Original)", category: "Makanan", price: 14000, hpp: 6000, stock: 50, sold: 118, badge: "Hemat", icon: "🍲" },
    { id: "PRD-04", name: "Ketoprak Telur Dadar", category: "Makanan", price: 18000, hpp: 8000, stock: 35, sold: 94, badge: "Terlaris", icon: "🍳" },
    { id: "PRD-05", name: "Es Jeruk Peras Segar", category: "Minuman", price: 6000, hpp: 2500, stock: 60, sold: 87, badge: "Segar", icon: "🍊" },
    { id: "PRD-06", name: "Kerupuk Udang / Emping", category: "Tambahan", price: 3000, hpp: 1200, stock: 100, sold: 165, badge: "Extra", icon: "🍘" }
  ],
  // Saldo Awal Laporan Keuangan SAK EMKM (Per 31 Oktober 2026)
  financials: {
    penjualanBersih: 5200000,
    bebanPokokPenjualan: 2300000,
    bebanGaji: 2200000,
    bebanSewaUtilitas: 350000,
    bebanPerlengkapan: 150000,
    kasDanBank: 1850000,
    persediaanBahanBaku: 450000,
    peralatanNeto: 3500000,
    utangUsahaPajak: 0,
    modalPemilik: 5600000,
    omzetJanSep2026: 45000000
  },
  salesHistory: [
    { invoice: "FK-202611-0089", date: "10/11/2026 12:30", cashier: "Karyawan 2", method: "Tunai", total: 110000 }
  ],
  expenseHistory: [
    {
      code: "KK-202611-0034",
      date: "2026-11-10",
      vendor: "Toko Bumbu Barokah",
      account: "5-1100",
      desc: "Pembelian Kacang Tanah 10kg, Tahu 100 potong, Bihun 5kg",
      amount: 350000,
      receiptName: "File_Nota.jpg"
    }
  ],
  payrollHistory: [
    {
      date: "2026-10-31",
      name: "Karyawan 1",
      role: "Staf Produksi",
      bruto: 2200000,
      pph21: 0,
      netPay: 2200000
    }
  ],
  invoiceCounter: 90,
  expenseCounter: 35
};

let appState = JSON.parse(localStorage.getItem("ketoprakRizkiState")) || JSON.parse(JSON.stringify(INITIAL_STATE));
let cart = [];
let selectedCategory = "Semua";

function saveState() {
  localStorage.setItem("ketoprakRizkiState", JSON.stringify(appState));
}

function formatRp(num) {
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

// INISIALISASI HALAMAN
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("expDate").value = today;
  document.getElementById("posDate").textContent = new Date().toLocaleDateString("id-ID");

  updateDocNumbers();
  renderProductGrid();
  renderCart();
  renderAllModules();
});

function updateDocNumbers() {
  const invNo = String(appState.invoiceCounter).padStart(4, "0");
  const expNo = String(appState.expenseCounter).padStart(4, "0");
  document.getElementById("invoiceNumber").textContent = `FK-202611-${invNo}`;
  document.getElementById("expenseNumber").textContent = `KK-202611-${expNo}`;
}

// SWITCH TAB & HAK AKSES (SEGREGATION OF DUTIES)
function switchTab(tabName) {
  const role = document.getElementById("roleSelect").value;
  if (role === "kasir" && tabName !== "pos") {
    alert("Akses Ditolak (Pengendalian Internal SOD): Akun Kasir hanya memiliki hak akses ke Modul Kasir POS.");
    return;
  }

  document.querySelectorAll(".tab-panel").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(`tab-${tabName}`).classList.add("active");
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add("active");
}

function switchRole(role) {
  const ownerButtons = document.querySelectorAll(".owner-only");
  ownerButtons.forEach((btn) => {
    btn.style.display = role === "kasir" ? "none" : "inline-block";
  });
  if (role === "kasir") {
    switchTab("pos");
  }
}

// KATALOG GRID ALA SHOPEE & KERANJANG POS
function filterCategory(cat, btnEl) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-chip").forEach((c) => c.classList.remove("active"));
  btnEl.classList.add("active");
  renderProductGrid();
}

function renderProductGrid() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const grid = document.getElementById("productGrid");

  const filtered = appState.products.filter((p) => {
    const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
    const matchKey = p.name.toLowerCase().includes(keyword) || p.id.toLowerCase().includes(keyword);
    return matchCat && matchKey;
  });

  grid.innerHTML = filtered
    .map(
      (p) => `
      <div class="product-card" onclick="addToCart('${p.id}')">
        <div class="product-thumb">
          <span class="badge-star">${p.badge}</span>
          <span class="badge-code">${p.id}</span>
          <span>${p.icon}</span>
        </div>
        <div class="product-info">
          <div class="product-title">${p.name}</div>
          <div>
            <div class="product-price">${formatRp(p.price)}</div>
            <div class="product-meta">
              <span>Stok: ${p.stock}</span>
              <span>${p.sold} terjual</span>
            </div>
            <button type="button" class="btn-add-mini">+ Tambah Pesanan</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function addToCart(productId) {
  const prod = appState.products.find((p) => p.id === productId);
  if (!prod || prod.stock <= 0) {
    alert("Stok produk habis!");
    return;
  }

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    if (existing.qty >= prod.stock) {
      alert("Jumlah melebihi stok tersedia.");
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({ id: prod.id, name: prod.name, price: prod.price, hpp: prod.hpp, qty: 1 });
  }
  renderCart();
}

function updateQty(productId, delta) {
  const idx = cart.findIndex((i) => i.id === productId);
  if (idx === -1) return;

  const prod = appState.products.find((p) => p.id === productId);
  const newQty = cart[idx].qty + delta;

  if (newQty <= 0) {
    cart.splice(idx, 1);
  } else if (newQty <= prod.stock) {
    cart[idx].qty = newQty;
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-cart">Belum ada menu dipilih. Klik produk di grid sebelah kiri.</p>`;
    document.getElementById("posGross").textContent = "Rp 0";
    document.getElementById("posDiscount").textContent = "Rp 0";
    document.getElementById("posTax").textContent = "Rp 0 / Rp 0";
    document.getElementById("posTotal").textContent = "Rp 0";
    return;
  }

  let gross = 0;
  container.innerHTML = cart
    .map((item) => {
      const subtotal = item.price * item.qty;
      gross += subtotal;
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <small>${formatRp(item.price)} x ${item.qty} = <strong>${formatRp(subtotal)}</strong></small>
          </div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `;
    })
    .join("");

  const discount = 0; // Dikunci otomatis sesuai kontrol internal
  const dpp = gross - discount;
  const ppn = 0; // Non-PKP 0%
  const totalBayar = dpp + ppn;

  document.getElementById("posGross").textContent = formatRp(gross);
  document.getElementById("posDiscount").textContent = formatRp(discount);
  document.getElementById("posTax").textContent = `${formatRp(dpp)} / Rp 0`;
  document.getElementById("posTotal").textContent = formatRp(totalBayar);
}

// PROSES PENJUALAN POS -> UPDATE STOK, JURNAL & CETAK STRUK 2 RANGKAP
function processSale() {
  if (cart.length === 0) {
    alert("Pilih minimal 1 menu sebelum memproses pembayaran.");
    return;
  }

  const cashier = document.getElementById("cashierName").value;
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const invoiceCode = document.getElementById("invoiceNumber").textContent;
  const timestamp = new Date().toLocaleString("id-ID");

  let totalBayar = 0;
  let totalHpp = 0;

  cart.forEach((item) => {
    totalBayar += item.price * item.qty;
    totalHpp += item.hpp * item.qty;

    const prod = appState.products.find((p) => p.id === item.id);
    if (prod) {
      prod.stock -= item.qty;
      prod.sold += item.qty;
    }
  });

  // Update Jurnal Otomatis (Double-Entry Seimbang)
  const fin = appState.financials;
  fin.penjualanBersih += totalBayar;
  fin.kasDanBank += totalBayar;

  const hppApplied = Math.min(totalHpp, fin.persediaanBahanBaku);
  fin.bebanPokokPenjualan += hppApplied;
  fin.persediaanBahanBaku -= hppApplied;

  appState.salesHistory.unshift({
    invoice: invoiceCode,
    date: timestamp,
    cashier: cashier,
    method: method,
    total: totalBayar
  });

  appState.invoiceCounter += 1;
  saveState();

  showReceiptModal(invoiceCode, timestamp, cashier, method, [...cart], totalBayar);

  cart = [];
  updateDocNumbers();
  renderProductGrid();
  renderCart();
  renderAllModules();
}

function showReceiptModal(invoice, date, cashier, method, items, total) {
  const itemsHtml = items
    .map(
      (i) =>
        `<div style="display:flex;justify-content:space-between;margin:3px 0;">
          <span>${i.name} (${i.qty}x)</span>
          <span>${formatRp(i.price * i.qty)}</span>
        </div>`
    )
    .join("");

  const buildCopy = (label) => `
    <div class="receipt-paper">
      <span class="copy-tag">${label}</span>
      <h4>KETOPRAK RIZKI</h4>
      <p style="text-align:center;font-size:11px;">Jl. Hayam Wuruk, Pleburan, Semarang</p>
      <hr style="margin:6px 0;"/>
      <p>No: ${invoice}</p>
      <p>Tgl: ${date}</p>
      <p>Kasir: ${cashier} | ${method}</p>
      <hr style="margin:6px 0;"/>
      ${itemsHtml}
      <hr style="margin:6px 0;"/>
      <div style="display:flex;justify-content:space-between;font-weight:bold;">
        <span>TOTAL BAYAR</span>
        <span>${formatRp(total)}</span>
      </div>
      <p style="font-size:10px;margin-top:6px;">DPP: ${formatRp(total)} | PPN (Non-PKP): Rp 0</p>
    </div>
  `;

  document.getElementById("receiptContent").innerHTML =
    buildCopy("RANGKAP 1: UNTUK PELANGGAN") + buildCopy("RANGKAP 2: UNTUK DAPUR");
  document.getElementById("receiptModal").classList.remove("hidden");
}

function closeReceiptModal() {
  document.getElementById("receiptModal").classList.add("hidden");
}

// MODUL 2.2 PEMBELIAN & KAS KELUAR
function submitExpense(e) {
  e.preventDefault();
  const code = document.getElementById("expenseNumber").textContent;
  const date = document.getElementById("expDate").value;
  const vendor = document.getElementById("expVendor").value;
  const account = document.getElementById("expAccount").value;
  const desc = document.getElementById("expDesc").value;
  const amount = Number(document.getElementById("expAmount").value);
  const fileInput = document.getElementById("expReceipt");

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Pengendalian Internal: Wajib mengunggah foto/file bukti nota fisik!");
    return;
  }

  const fin = appState.financials;
  if (amount > fin.kasDanBank) {
    alert("Saldo Kas dan Bank tidak mencukupi untuk pengeluaran ini.");
    return;
  }

  // Pencatatan Akuntansi Otomatis sesuai Kode Akun
  fin.kasDanBank -= amount;
  if (account === "1-1300") {
    fin.persediaanBahanBaku += amount;
  } else if (account === "5-1100") {
    fin.bebanPokokPenjualan += amount;
  } else if (account === "5-2200") {
    fin.bebanSewaUtilitas += amount;
  } else {
    fin.bebanPerlengkapan += amount;
  }

  appState.expenseHistory.unshift({
    code,
    date,
    vendor,
    account,
    desc,
    amount,
    receiptName: fileInput.files[0].name
  });

  appState.expenseCounter += 1;
  saveState();
  e.target.reset();
  document.getElementById("expDate").value = new Date().toISOString().split("T")[0];
  updateDocNumbers();
  renderAllModules();
  alert(`Kas Keluar ${code} berhasil dicatat dan memperbarui Laporan Keuangan.`);
}

// MODUL 2.3 PENGGAJIAN & PPh 21
function calcPayrollPreview() {
  const base = Number(document.getElementById("payBase").value) || 0;
  const allowance = Number(document.getElementById("payAllowance").value) || 0;
  const deduction = Number(document.getElementById("payDeduction").value) || 0;

  const bruto = base + allowance;
  // Tarif Efektif Rata-rata (TER A) = 0% untuk bruto <= Rp 4.500.000/bulan
  const pph21 = bruto <= 4500000 ? 0 : Math.round(bruto * 0.0025);
  const netPay = bruto - pph21 - deduction;

  document.getElementById("prevBruto").textContent = formatRp(bruto);
  document.getElementById("prevPph21").textContent =
    pph21 === 0 ? "Rp 0 (0% — Di bawah PTKP Rp4,5 Jt)" : `${formatRp(pph21)} (TER A)`;
  document.getElementById("prevNetPay").textContent = formatRp(netPay);
}

function submitPayroll(e) {
  e.preventDefault();
  const empRaw = document.getElementById("payEmployee").value.split("|");
  const base = Number(document.getElementById("payBase").value) || 0;
  const allowance = Number(document.getElementById("payAllowance").value) || 0;
  const deduction = Number(document.getElementById("payDeduction").value) || 0;

  const bruto = base + allowance;
  const pph21 = bruto <= 4500000 ? 0 : Math.round(bruto * 0.0025);
  const netPay = bruto - pph21 - deduction;

  const fin = appState.financials;
  if (netPay > fin.kasDanBank) {
    alert("Saldo Kas tidak mencukupi untuk pembayaran gaji.");
    return;
  }

  fin.bebanGaji += bruto;
  fin.kasDanBank -= netPay;
  fin.utangUsahaPajak += pph21;

  appState.payrollHistory.unshift({
    date: new Date().toISOString().split("T")[0],
    name: empRaw[0],
    role: empRaw[1],
    bruto,
    pph21,
    netPay
  });

  saveState();
  renderAllModules();
  alert(`Slip gaji untuk ${empRaw[0]} berhasil diproses!`);
}

// RENDER SELURUH TABEL, LAPORAN SAK EMKM & DASBOR PAJAK
function renderAllModules() {
  // 1. Master Data Produk
  document.getElementById("masterProductBody").innerHTML = appState.products
    .map(
      (p) => `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.icon} ${p.name}</td>
        <td>${p.category}</td>
        <td>${formatRp(p.price)}</td>
        <td>${formatRp(p.hpp)}</td>
        <td><strong>${p.stock} porsi</strong></td>
        <td>${p.stock > 10 ? "✅ Aman" : "⚠️ Menipis"}</td>
      </tr>
    `
    )
    .join("");

  // 2. Riwayat Penjualan
  document.getElementById("salesHistoryBody").innerHTML = appState.salesHistory
    .map(
      (s) => `
      <tr>
        <td><strong>${s.invoice}</strong></td>
        <td>${s.date}</td>
        <td>${s.cashier}</td>
        <td>${s.method}</td>
        <td><strong>${formatRp(s.total)}</strong></td>
      </tr>
    `
    )
    .join("");

  // 3. Riwayat Kas Keluar
  document.getElementById("expenseHistoryBody").innerHTML = appState.expenseHistory
    .map(
      (ex) => `
      <tr>
        <td><strong>${ex.code}</strong><br/><small>${ex.date}</small></td>
        <td><strong>${ex.vendor}</strong><br/><small>${ex.desc}</small></td>
        <td>${ex.account}</td>
        <td><strong>${formatRp(ex.amount)}</strong></td>
        <td>📎 ${ex.receiptName}</td>
      </tr>
    `
    )
    .join("");

  // 4. Riwayat Penggajian
  document.getElementById("payrollHistoryBody").innerHTML = appState.payrollHistory
    .map(
      (py) => `
      <tr>
        <td>${py.date}</td>
        <td><strong>${py.name}</strong><br/><small>${py.role}</small></td>
        <td>${formatRp(py.bruto)}</td>
        <td>${formatRp(py.pph21)}</td>
        <td><strong>${formatRp(py.netPay)}</strong></td>
      </tr>
    `
    )
    .join("");

  // 5. Kalkulasi Pajak PP 55/2022 & Laporan Keuangan SAK EMKM
  const fin = appState.financials;
  const omzetKumulatif = fin.omzetJanSep2026 + fin.penjualanBersih;
  const batasPtkpUmkm = 500000000;
  const pphFinal = omzetKumulatif > batasPtkpUmkm ? Math.round((omzetKumulatif - batasPtkpUmkm) * 0.005) : 0;

  const labaKotor = fin.penjualanBersih - fin.bebanPokokPenjualan;
  const totalBebanOps = fin.bebanGaji + fin.bebanSewaUtilitas + fin.bebanPerlengkapan;
  const labaSebelumPajak = labaKotor - totalBebanOps;
  const labaSetelahPajak = labaSebelumPajak - pphFinal;

  // Render Laporan Laba Rugi
  document.getElementById("incomeStatementTable").innerHTML = `
    <tr class="section-head"><td>PENDAPATAN</td><td class="text-right">Jumlah (Rp)</td></tr>
    <tr><td>Penjualan Bersih</td><td class="text-right">${formatRp(fin.penjualanBersih)}</td></tr>
    <tr><td>Beban Pokok Penjualan (HPP)</td><td class="text-right">(${formatRp(fin.bebanPokokPenjualan)})</td></tr>
    <tr class="section-head"><td>LABA KOTOR</td><td class="text-right">${formatRp(labaKotor)}</td></tr>
    <tr class="section-head"><td colspan="2">BEBAN OPERASIONAL</td></tr>
    <tr><td>- Beban Gaji Karyawan</td><td class="text-right">(${formatRp(fin.bebanGaji)})</td></tr>
    <tr><td>- Beban Sewa &amp; Utilitas (Listrik/Air)</td><td class="text-right">(${formatRp(fin.bebanSewaUtilitas)})</td></tr>
    <tr><td>- Beban Perlengkapan &amp; Operasional Lain</td><td class="text-right">(${formatRp(fin.bebanPerlengkapan)})</td></tr>
    <tr class="section-head"><td>LABA BERSIH SEBELUM PAJAK</td><td class="text-right">${formatRp(labaSebelumPajak)}</td></tr>
    <tr><td>Pajak Penghasilan (PPh Final 0,5% PP 55/2022)</td><td class="text-right">(${formatRp(pphFinal)})</td></tr>
    <tr class="total-row"><td>LABA BERSIH SETELAH PAJAK</td><td class="text-right">${formatRp(labaSetelahPajak)}</td></tr>
  `;

  // Render Neraca (Laporan Posisi Keuangan)
  const totalAsetLancar = fin.kasDanBank + fin.persediaanBahanBaku;
  const totalAset = totalAsetLancar + fin.peralatanNeto;
  const totalLiabilitas = fin.utangUsahaPajak + pphFinal;
  const totalLiabilitasEkuitas = totalLiabilitas + fin.modalPemilik + labaSetelahPajak;

  document.getElementById("balanceSheetTable").innerHTML = `
    <tr class="section-head"><td colspan="2">ASET</td></tr>
    <tr><td>Kas dan Bank</td><td class="text-right">${formatRp(fin.kasDanBank)}</td></tr>
    <tr><td>Persediaan Bahan Baku</td><td class="text-right">${formatRp(fin.persediaanBahanBaku)}</td></tr>
    <tr class="section-head"><td>Total Aset Lancar</td><td class="text-right">${formatRp(totalAsetLancar)}</td></tr>
    <tr><td>Peralatan Usaha (Neto)</td><td class="text-right">${formatRp(fin.peralatanNeto)}</td></tr>
    <tr class="total-row"><td>TOTAL ASET</td><td class="text-right">${formatRp(totalAset)}</td></tr>
    <tr class="section-head"><td colspan="2">LIABILITAS DAN EKUITAS</td></tr>
    <tr><td>Utang Usaha &amp; Pajak Terutang</td><td class="text-right">${formatRp(totalLiabilitas)}</td></tr>
    <tr><td>Modal Pemilik</td><td class="text-right">${formatRp(fin.modalPemilik)}</td></tr>
    <tr><td>Laba Ditahan / Berjalan</td><td class="text-right">${formatRp(labaSetelahPajak)}</td></tr>
    <tr class="total-row"><td>TOTAL LIABILITAS &amp; EKUITAS</td><td class="text-right">${formatRp(totalLiabilitasEkuitas)}</td></tr>
  `;

  const isBalanced = Math.round(totalAset) === Math.round(totalLiabilitasEkuitas);
  document.getElementById("balanceStatusBadge").textContent = isBalanced
    ? "✅ STATUS NERACA SEIMBANG (BALANCE): Total Aset = Total Liabilitas & Ekuitas"
    : "⚠️ Terdapat Selisih Pembulatan";

  // Update Dasbor Pajak PP 55/2022
  const pct = Math.min((omzetKumulatif / batasPtkpUmkm) * 100, 100).toFixed(2);
  document.getElementById("taxCurrentPeriod").textContent = formatRp(fin.penjualanBersih);
  document.getElementById("taxCumulative").textContent = formatRp(omzetKumulatif);
  document.getElementById("taxPayable").textContent = formatRp(pphFinal);
  document.getElementById("taxPercent").textContent = `${pct}%`;
  document.getElementById("taxProgressFill").style.width = `${pct}%`;

  const statusText = omzetKumulatif <= batasPtkpUmkm ? "Fasilitas Bebas Pajak (0%)" : "Wajib Setor 0,5%";
  document.getElementById("headerTaxStatus").textContent =
    omzetKumulatif <= batasPtkpUmkm ? "0% Bebas Pajak" : "0,5% PP 55";

  document.getElementById("taxRecapBody").innerHTML = `
    <tr>
      <td>Jan - Sep 2026</td>
      <td>${formatRp(fin.omzetJanSep2026)}</td>
      <td>${formatRp(fin.omzetJanSep2026)}</td>
      <td>Fasilitas Bebas Pajak</td>
      <td>Rp 0</td>
    </tr>
    <tr>
      <td>Okt - Nov 2026 (Berjalan)</td>
      <td>${formatRp(fin.penjualanBersih)}</td>
      <td><strong>${formatRp(omzetKumulatif)}</strong></td>
      <td><strong>${statusText}</strong></td>
      <td><strong>${formatRp(pphFinal)}</strong></td>
    </tr>
  `;
}

function resetDemoData() {
  if (confirm("Kembalikan seluruh data ke saldo awal Laporan Tahap 2 (31 Oktober 2026)?")) {
    localStorage.removeItem("ketoprakRizkiState");
    appState = JSON.parse(JSON.stringify(INITIAL_STATE));
    cart = [];
    updateDocNumbers();
    renderProductGrid();
    renderCart();
    renderAllModules();
  }
}