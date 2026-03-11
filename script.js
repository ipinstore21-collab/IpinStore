// ─── DATA ───────────────────────────────────────────────
let data = JSON.parse(localStorage.getItem('ipin_layanan')) || []
let mode = 'customer'
let activeTab = 'Semua'
let clickCount = 0
let clickTimer = null
let currentOrder = null

const WA_NUMBER = '62881012955394'
const ADMIN_PASS = '1234'

// ─── SIMPAN ─────────────────────────────────────────────
function simpan() {
  localStorage.setItem('ipin_layanan', JSON.stringify(data))
  renderTabs()
  tampil()
}

// ─── TAMBAH ─────────────────────────────────────────────
function tambah() {
  const kat    = document.getElementById('kategori').value.trim()
  const sub    = document.getElementById('sub').value.trim()
  const nama   = document.getElementById('nama').value.trim()
  const harga  = document.getElementById('harga').value.trim()
  const jumlah = document.getElementById('jumlah').value.trim()
  const minOrd = document.getElementById('minOrder').value.trim() || '10'
  const maxOrd = document.getElementById('maxOrder').value.trim() || jumlah || '10000'

  if (!kat || !nama || !harga || !jumlah) {
    showToast('⚠️ Isi semua kolom dulu ya!')
    return
  }

  data.push({ kategori: kat, sub, nama, harga, jumlah, min: minOrd, max: maxOrd })
  simpan()

  ;['kategori','sub','nama','harga','jumlah','minOrder','maxOrder'].forEach(id => {
    document.getElementById(id).value = ''
  })

  showToast('✅ Layanan berhasil ditambah!')
}

// ─── HAPUS ──────────────────────────────────────────────
function hapus(i) {
  if (!confirm(`Hapus "${data[i].nama}"?`)) return
  data.splice(i, 1)
  simpan()
  showToast('🗑️ Layanan dihapus')
}

// ─── EDIT ───────────────────────────────────────────────
function edit(i) {
  const item = data[i]
  const baru = prompt(`Edit harga (sekarang: ${item.harga}):`, item.harga)
  if (baru === null) return
  if (baru.trim()) data[i].harga = baru.trim()

  const newMin = prompt(`Edit Min Order (sekarang: ${item.min || 10}):`, item.min || 10)
  if (newMin === null) { simpan(); showToast('✏️ Diperbarui!'); return }
  if (newMin.trim()) data[i].min = newMin.trim()

  const newMax = prompt(`Edit Max Order (sekarang: ${item.max || item.jumlah}):`, item.max || item.jumlah)
  if (newMax === null) { simpan(); showToast('✏️ Diperbarui!'); return }
  if (newMax.trim()) data[i].max = newMax.trim()

  simpan()
  showToast('✏️ Layanan diperbarui!')
}

// ─── FORMAT HARGA ───────────────────────────────────────
function fmtRp(val) {
  const n = parseInt(val)
  if (isNaN(n)) return val
  return 'Rp ' + n.toLocaleString('id-ID')
}

// ─── TABS ───────────────────────────────────────────────
function renderTabs() {
  const wrap = document.getElementById('tabsWrap')
  const cats = ['Semua', ...new Set(data.map(x => x.kategori).filter(Boolean))]

  // pastikan activeTab valid
  if (!cats.includes(activeTab)) activeTab = 'Semua'

  wrap.innerHTML = cats.map(c => `
    <button class="tab-btn ${activeTab === c ? 'active' : ''}"
      onclick="switchTab('${c}')">
      ${c === 'Semua' ? '🌐 ' : ''}${c}
    </button>
  `).join('')
}

function switchTab(cat) {
  activeTab = cat
  renderTabs()
  tampil()
}

// ─── TAMPIL ─────────────────────────────────────────────
function tampil() {
  const listEl = document.getElementById('list')
  const cari = document.getElementById('search').value.toLowerCase()

  // filter by tab & search
  let filtered = data.filter((x, i) => {
    const matchTab = activeTab === 'Semua' || x.kategori === activeTab
    const matchSearch = (x.nama + x.sub + x.kategori).toLowerCase().includes(cari)
    return matchTab && matchSearch
  })

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Layanan tidak ditemukan</p>
      </div>
    `
    return
  }

  // group by sub
  const subs = [...new Set(filtered.map(x => x.sub || 'Lainnya'))]
  let html = ''

  subs.forEach(s => {
    const items = filtered.filter(x => (x.sub || 'Lainnya') === s)
    if (items.length === 0) return

    if (subs.length > 1) {
      html += `<div class="sub-label">${s}</div>`
    }

    items.forEach(x => {
      const realIdx = data.indexOf(x)
      const adminBtns = mode === 'admin' ? `
        <button class="btn-edit" onclick="edit(${realIdx})">✏️</button>
        <button class="btn-delete" onclick="hapus(${realIdx})">🗑️</button>
      ` : ''

      html += `
        <div class="card">
          <div class="card-info">
            <div class="card-name">${x.nama}</div>
            <div class="card-sub">${x.jumlah} unit · ${x.sub || x.kategori}</div>
          </div>
          <div class="card-price">${fmtRp(x.harga)}</div>
          <div class="card-actions">
            <button class="btn-order" onclick='openModal(${JSON.stringify(x)})'>Order</button>
            ${adminBtns}
          </div>
        </div>
      `
    })
  })

  listEl.innerHTML = html
}

// ─── MODAL ORDER ────────────────────────────────────────
function openModal(item) {
  currentOrder = item

  const minVal = parseInt(item.min) || 10
  const maxVal = parseInt(item.max) || parseInt(item.jumlah) || 10000

  document.getElementById('modalTitle').textContent = item.nama
  document.getElementById('modalSubtitle').textContent = `${item.kategori} · ${item.sub || ''}`
  document.getElementById('badgeMin').textContent = `Min: ${minVal.toLocaleString('id-ID')}`
  document.getElementById('badgeMax').textContent = `Max: ${maxVal.toLocaleString('id-ID')}`
  document.getElementById('modalUser').value = ''
  document.getElementById('modalQty').value = ''
  document.getElementById('modalQty').min = minVal
  document.getElementById('modalQty').max = maxVal
  document.getElementById('modalBiaya').textContent = '—'

  document.getElementById('modalOverlay').classList.add('open')
  document.body.style.overflow = 'hidden'
  setTimeout(() => document.getElementById('modalUser').focus(), 300)
}

function hitungBiaya() {
  if (!currentOrder) return
  const qty = parseInt(document.getElementById('modalQty').value)
  const hargaSatuan = parseInt(currentOrder.harga)
  const jumlahPaket = parseInt(currentOrder.jumlah)

  if (!qty || isNaN(qty) || qty <= 0) {
    document.getElementById('modalBiaya').textContent = '—'
    return
  }

  // hitung proporsional: (qty / jumlah_paket) * harga_paket
  const total = Math.ceil((qty / jumlahPaket) * hargaSatuan)
  document.getElementById('modalBiaya').textContent = total.toLocaleString('id-ID')
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open')
  document.body.style.overflow = ''
  currentOrder = null
}

function sendWA() {
  if (!currentOrder) return

  const user = document.getElementById('modalUser').value.trim() || '(belum diisi)'
  const qty = document.getElementById('modalQty').value.trim() || currentOrder.jumlah
  const biayaEl = document.getElementById('modalBiaya').textContent
  const biaya = biayaEl === '—' ? fmtRp(currentOrder.harga) : 'Rp ' + biayaEl

  if (!document.getElementById('modalUser').value.trim()) {
    showToast('⚠️ Isi Link / Target dulu ya!')
    document.getElementById('modalUser').focus()
    return
  }

  const msg =
`Halo kak, saya mau order! 👋

🛒 *Detail Order:*
• Platform : ${currentOrder.kategori}
• Layanan  : ${currentOrder.nama}
• Jumlah   : ${parseInt(qty).toLocaleString('id-ID')}
• Biaya    : ${biaya}

🔗 Link/Target: ${user}

Mohon segera diproses ya kak, terima kasih! 🙏`

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  closeModal()
}

// ─── SECRET ADMIN (klik logo 3x) ────────────────────────
document.getElementById('logoClick').addEventListener('click', function () {
  clickCount++
  this.classList.add('clicked')
  setTimeout(() => this.classList.remove('clicked'), 200)

  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => { clickCount = 0 }, 1200)

  if (clickCount >= 3) {
    clickCount = 0
    clearTimeout(clickTimer)

    if (mode === 'customer') {
      const pass = prompt('🔐 Password:')
      if (pass === ADMIN_PASS) {
        mode = 'admin'
        document.getElementById('admin').style.display = 'block'
        document.getElementById('adminBadge').style.display = 'block'
        tampil()
        showToast('🛡️ Mode Admin aktif')
      } else if (pass !== null) {
        showToast('❌ Password salah!')
      }
    } else {
      mode = 'customer'
      document.getElementById('admin').style.display = 'none'
      document.getElementById('adminBadge').style.display = 'none'
      tampil()
      showToast('👤 Kembali ke mode Customer')
    }
  }
})

// ─── TOAST ──────────────────────────────────────────────
function showToast(msg) {
  let t = document.querySelector('.toast')
  if (!t) {
    t = document.createElement('div')
    t.className = 'toast'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2500)
}

// ─── INIT ───────────────────────────────────────────────
renderTabs()
tampil()
