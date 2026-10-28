
"use strict";

const statuses = [
  "Diterima",
  "Dicuci",
  "Dikeringkan",
  "Disetrika",
  "Siap Diambil",
  "Selesai"
];

const statusColors = {
  Diterima: "#e9efff",
  Dicuci: "#fff0df",
  Dikeringkan: "#eee8ff",
  Disetrika: "#e1f5f1",
  "Siap Diambil": "#dff5e6",
  Selesai: "#e8edef"
};

const PAYMENT_UNPAID = "Belum Dibayar";
const PAYMENT_PAID = "Sudah Dibayar";
const STORAGE_KEY = "washitData";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);



const sampleData = [
  {
    id: "WS-1001",
    customer: "Siti Rahma",
    phone: "081234567801",
    service: "Cuci + Setrika",
    weight: 3,
    price: 8000,
    total: 24000,
    status: "Dicuci",
    payment: PAYMENT_PAID,
    date: "2026-10-27"
  },
  {
    id: "WS-1002",
    customer: "Made Putra",
    phone: "081234567802",
    service: "Cuci Kering",
    weight: 2.5,
    price: 7000,
    total: 17500,
    status: "Dikeringkan",
    payment: PAYMENT_UNPAID,
    date: "2026-10-27"
  },
  {
    id: "WS-1003",
    customer: "Ayu Lestari",
    phone: "081234567803",
    service: "Express",
    weight: 2,
    price: 12000,
    total: 24000,
    status: "Siap Diambil",
    payment: PAYMENT_PAID,
    date: "2026-10-28"
  },
  {
    id: "WS-1004",
    customer: "Budi Santoso",
    phone: "081234567804",
    service: "Setrika Saja",
    weight: 4,
    price: 5000,
    total: 20000,
    status: "Selesai",
    payment: PAYMENT_PAID,
    date: "2026-10-26"
  },
  {
    id: "WS-1005",
    customer: "Dewi Anggraini",
    phone: "081234567805",
    service: "Cuci Kering",
    weight: 3,
    price: 7000,
    total: 21000,
    status: "Diterima",
    payment: PAYMENT_UNPAID,
    date: "2026-10-28"
  }
];


function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Unable to load WASHIT data:", error);
  }

  return sampleData.map((order) => ({ ...order }));
}

let data = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
    return true;
  } catch (error) {
    console.error("Unable to save WASHIT data:", error);
    showToast("Data tidak dapat disimpan di browser.");
    render();
    return false;
  }
}


function initializeApp() {
  const dateElement = document.getElementById("date");

  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  document.querySelectorAll(".nav button").forEach((button) => {
    button.addEventListener("click", () => {
      go(button.dataset.page);
    });
  });

  const form = document.getElementById("form");

  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  const modal = document.getElementById("modal");

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target.id === "modal") {
        closeModal();
      }
    });
  }

  render();
}


function go(page) {
  document.querySelectorAll(".page").forEach((element) => {
    element.classList.remove("active");
  });

  const selectedPage = document.getElementById(`page-${page}`);

  if (!selectedPage) {
    console.error(`Page not found: ${page}`);
    return;
  }

  selectedPage.classList.add("active");

  document.querySelectorAll(".nav button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const titles = {
    dashboard: "Dashboard",
    orders: "Pesanan",
    customers: "Pelanggan",
    payments: "Pembayaran",
    reports: "Laporan"
  };

  const titleElement = document.getElementById("topTitle");

  if (titleElement) {
    titleElement.textContent = titles[page] || "WASHIT";
  }

  render();
}


let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2300);
}


function statusPill(status) {
  const color = statusColors[status] || "#e8f7f3";

  return `
    <span class="pill" style="background:${color}">
      ${escapeHTML(status)}
    </span>
  `;
}

function paymentPill(payment) {
  const color =
    payment === PAYMENT_PAID ? "#dff5e6" : "#fff0df";

  const extraClass =
    payment === PAYMENT_PAID ? "done" : "unpaid";

  return `
    <span class="pill ${extraClass}" style="background:${color}">
      ${escapeHTML(payment)}
    </span>
  `;
}

function statusControl(order) {
  const options = statuses.map((status) => `
    <option value="${escapeHTML(status)}"
      ${status === order.status ? "selected" : ""}>
      ${escapeHTML(status)}
    </option>
  `).join("");

  return `
    <select class="act"
      aria-label="Status pesanan ${escapeHTML(order.id)}"
      onchange="changeStatus('${escapeHTML(order.id)}', this.value)">
      ${options}
    </select>
  `;
}

function paymentControl(order) {
  return `
    <select class="act"
      aria-label="Status pembayaran ${escapeHTML(order.id)}"
      onchange="changePayment('${escapeHTML(order.id)}', this.value)">
      <option value="${PAYMENT_UNPAID}"
        ${order.payment === PAYMENT_UNPAID ? "selected" : ""}>
        ${PAYMENT_UNPAID}
      </option>
      <option value="${PAYMENT_PAID}"
        ${order.payment === PAYMENT_PAID ? "selected" : ""}>
        ${PAYMENT_PAID}
      </option>
    </select>
  `;
}


function renderDashboard() {
  const paidOrders = data.filter(
    (order) => order.payment === PAYMENT_PAID
  );

  const unpaidOrders = data.filter(
    (order) => order.payment === PAYMENT_UNPAID
  );

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  setText("total", data.length);

  setText(
    "progress",
    data.filter(
      (order) =>
        !["Siap Diambil", "Selesai"].includes(order.status)
    ).length
  );

  setText(
    "ready",
    data.filter((order) => order.status === "Siap Diambil").length
  );

  setText("revenue", formatCurrency(revenue));

  const recentElement = document.getElementById("recent");

  if (recentElement) {
    const recentOrders = [...data].reverse().slice(0, 5);

    recentElement.innerHTML = recentOrders.map((order) => `
      <tr>
        <td>
          <strong>${escapeHTML(order.id)}</strong><br>
          ${escapeHTML(order.customer)}
        </td>
        <td>${escapeHTML(order.service)}</td>
        <td>${formatCurrency(order.total)}</td>
        <td>${statusPill(order.status)}</td>
        <td>${paymentPill(order.payment)}</td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="5" class="empty">Belum ada pesanan.</td>
      </tr>
    `;
  }

  const summary = document.getElementById("paySummary");

  if (summary) {
    const unpaidTotal = unpaidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    summary.innerHTML = `
      <div class="item">
        <b>Sudah dibayar</b>
        <span>${paidOrders.length} pesanan</span>
      </div>
      <div class="item">
        <b>Belum dibayar</b>
        <span>${unpaidOrders.length} pesanan</span>
      </div>
      <div class="item">
        <b>Tagihan tertunda</b>
        <span>${formatCurrency(unpaidTotal)}</span>
      </div>
    `;
  }
}


function renderOrders() {
  const searchElement = document.getElementById("search");
  const filterElement = document.getElementById("filter");

  const query = (searchElement?.value || "").toLowerCase().trim();
  const filter = filterElement?.value || "";

  const filteredOrders = [...data]
    .filter((order) => {
      const searchableText = [
        order.id,
        order.customer,
        order.phone,
        order.service
      ].join(" ").toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (!filter || order.status === filter)
      );
    })
    .reverse();

  const table = document.getElementById("orders");

  if (!table) return;

  table.innerHTML = filteredOrders.map((order) => `
    <tr>
      <td>
        <strong>${escapeHTML(order.id)}</strong><br>
        ${escapeHTML(order.customer)}
      </td>
      <td>${escapeHTML(order.phone || "-")}</td>
      <td>${escapeHTML(order.service)}</td>
      <td>${Number(order.weight)} kg</td>
      <td><strong>${formatCurrency(order.total)}</strong></td>
      <td>${statusControl(order)}</td>
      <td>${paymentControl(order)}</td>
      <td>
        <button class="btn light"
          style="padding:7px"
          onclick="deleteOrder('${escapeHTML(order.id)}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="8" class="empty">Tidak ada pesanan.</td>
    </tr>
  `;
}

function renderCustomers() {
  const searchElement = document.getElementById("csearch");
  const query = (searchElement?.value || "").toLowerCase().trim();

  const customerMap = new Map();

  data.forEach((order) => {
    const key = String(order.customer || "").toLowerCase();

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: order.customer,
        phone: order.phone || "",
        count: 0,
        total: 0
      });
    }

    const customer = customerMap.get(key);

    customer.count += 1;
    customer.total += Number(order.total || 0);

    if (!customer.phone && order.phone) {
      customer.phone = order.phone;
    }
  });

  const customers = [...customerMap.values()].filter((customer) =>
    `${customer.name} ${customer.phone}`
      .toLowerCase()
      .includes(query)
  );

  const table = document.getElementById("customers");

  if (!table) return;

  table.innerHTML = customers.map((customer) => `
    <tr>
      <td><strong>${escapeHTML(customer.name)}</strong></td>
      <td>${escapeHTML(customer.phone || "-")}</td>
      <td>${customer.count}</td>
      <td>${formatCurrency(customer.total)}</td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="4" class="empty">Belum ada data pelanggan.</td>
    </tr>
  `;
}


function renderPayments() {
  const paidOrders = data.filter(
    (order) => order.payment === PAYMENT_PAID
  );

  const unpaidOrders = data.filter(
    (order) => order.payment === PAYMENT_UNPAID
  );

  setText("paidCount", paidOrders.length);
  setText("unpaidCount", unpaidOrders.length);

  const table = document.getElementById("payments");

  if (!table) return;

  table.innerHTML = [...data].reverse().map((order) => `
    <tr>
      <td>
        <strong>${escapeHTML(order.id)}</strong><br>
        ${escapeHTML(order.customer)}
      </td>
      <td>${escapeHTML(order.date || "-")}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>${paymentPill(order.payment)}</td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="4" class="empty">Belum ada transaksi.</td>
    </tr>
  `;
}

function renderReports() {
  const paidTotal = data
    .filter((order) => order.payment === PAYMENT_PAID)
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const unpaidTotal = data
    .filter((order) => order.payment === PAYMENT_UNPAID)
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const uniqueCustomers = new Set(
    data.map((order) => String(order.customer || "").toLowerCase())
  );

  setText("rTotal", data.length);
  setText("rRevenue", formatCurrency(paidTotal));
  setText("rUnpaid", formatCurrency(unpaidTotal));
  setText("rCustomers", uniqueCustomers.size);

  const bars = document.getElementById("bars");

  if (!bars) return;

  bars.innerHTML = statuses.map((status) => {
    const count = data.filter(
      (order) => order.status === status
    ).length;

    const percentage = data.length
      ? (count / data.length) * 100
      : 0;

    return `
      <div class="bar">
        <div class="barlabel">
          <span>${escapeHTML(status)}</span>
          <b>${count}</b>
        </div>
        <div class="track">
          <div class="fill" style="width:${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}
function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function render() {
  renderDashboard();
  renderOrders();
  renderCustomers();
  renderPayments();
  renderReports();
}

function openModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.style.display = "flex";
  }
}

function closeModal() {
  const modal = document.getElementById("modal");
  const form = document.getElementById("form");

  if (modal) {
    modal.style.display = "none";
  }

  if (form) {
    form.reset();
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);

  const customer = String(formData.get("customer") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const service = String(formData.get("service") || "").trim();
  const weight = Number(formData.get("weight"));
  const price = Number(formData.get("price"));
  const payment = String(formData.get("payment") || PAYMENT_UNPAID);

  if (!customer || !service || weight <= 0 || price < 0) {
    showToast("Periksa kembali data pesanan.");
    return;
  }

  if (![PAYMENT_PAID, PAYMENT_UNPAID].includes(payment)) {
    showToast("Status pembayaran tidak valid.");
    return;
  }

  const highestID = data.reduce((highest, order) => {
    const match = String(order.id).match(/(\d+)$/);
    return Math.max(highest, match ? Number(match[1]) : 1000);
  }, 1000);

  const newOrder = {
    id: `WS-${highestID + 1}`,
    customer,
    phone,
    service,
    weight,
    price,
    total: Math.round(weight * price),
    status: "Diterima",
    payment,
    date: [
      new Date().getFullYear(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0")
    ].join("-")
  };

  data.push(newOrder);

  saveData();
  closeModal();
  go("orders");
  showToast("Pesanan berhasil ditambahkan.");
}


function changeStatus(id, newStatus) {
  if (!statuses.includes(newStatus)) {
    showToast("Status pesanan tidak valid.");
    render();
    return;
  }

  const order = data.find((item) => item.id === id);

  if (!order) return;

  order.status = newStatus;
  saveData();
  showToast("Status pesanan diperbarui.");
}

function changePayment(id, newPayment) {
  if (![PAYMENT_PAID, PAYMENT_UNPAID].includes(newPayment)) {
    showToast("Status pembayaran tidak valid.");
    render();
    return;
  }

  const order = data.find((item) => item.id === id);

  if (!order) return;

  order.payment = newPayment;
  saveData();
  showToast("Pembayaran berhasil diperbarui.");
}

// Keep compatibility with the original HTML.
function changePay(id, newPayment) {
  changePayment(id, newPayment);
}


function deleteOrder(id) {
  const order = data.find((item) => item.id === id);

  if (!order) return;

  if (confirm(`Hapus pesanan ${id}?`)) {
    data = data.filter((item) => item.id !== id);
    saveData();
    showToast("Pesanan berhasil dihapus.");
  }
}

// Keep compatibility with the original HTML.
function del(id) {
  deleteOrder(id);
}


function resetDemo() {
  if (
    confirm(
      "Kembalikan data contoh WASHIT? Perubahan data saat ini akan dihapus."
    )
  ) {
    data = sampleData.map((order) => ({ ...order }));
    saveData();
    showToast("Data contoh berhasil dipulihkan.");
  }
}


function exportCSV() {
  const headers = [
    "ID",
    "Nama",
    "Telepon",
    "Layanan",
    "Berat kg",
    "Harga per kg",
    "Total",
    "Status",
    "Pembayaran",
    "Tanggal"
  ];

  const rows = data.map((order) => [
    order.id,
    order.customer,
    order.phone,
    order.service,
    order.weight,
    order.price,
    order.total,
    order.status,
    order.payment,
    order.date
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((value) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csvContent],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "laporan-washit.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("Laporan CSV berhasil diunduh.");
}

function csv() {
  exportCSV();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
