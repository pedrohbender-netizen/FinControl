// Chave para guardar no navegador (LocalStorage)
const STORAGE_KEY = 'financas_transacoes';

// Estado da aplicação
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let chartInstance = null;

// Elementos do DOM
const form = document.getElementById('finance-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const dayInput = document.getElementById('day');
const monthInput = document.getElementById('month');
const yearInput = document.getElementById('year');

const totalEntradasEl = document.getElementById('total-entradas');
const totalSaidasEl = document.getElementById('total-saidas');
const totalSaldoEl = document.getElementById('total-saldo');

const progressBarFill = document.getElementById('progress-bar-fill');
const budgetPercentageText = document.getElementById('budget-percentage-text');
const budgetStatusText = document.getElementById('budget-status-text');
const topExpensesList = document.getElementById('top-expenses-list');
const dailyAverageVal = document.getElementById('daily-average-val');
const btnToggleDetails = document.getElementById('btn-toggle-details');
const budgetDetails = document.getElementById('budget-details');

const transactionListEl = document.getElementById('transaction-list');
const searchInput = document.getElementById('search-input');
const filterMonthInput = document.getElementById('filter-month');
const filterYearInput = document.getElementById('filter-year');

const btnClearAll = document.getElementById('btn-clear-all');
const btnExportCsv = document.getElementById('btn-export-csv');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  setDefaultDateSelects();
  renderApp();
  setupEventListeners();
});

// Configurar a data de hoje por defeito nos seletores
function setDefaultDateSelects() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear());

  if (dayInput && !dayInput.value) dayInput.value = day;
  if (monthInput && !monthInput.value) monthInput.value = month;
  if (yearInput && !yearInput.value) yearInput.value = year;
}

// Configurar Eventos
function setupEventListeners() {
  if (form) {
    form.addEventListener('submit', handleAddTransaction);
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderApp);
  }

  if (filterMonthInput) {
    filterMonthInput.addEventListener('change', renderApp);
  }

  if (filterYearInput) {
    filterYearInput.addEventListener('change', renderApp);
  }

  if (btnClearAll) {
    btnClearAll.addEventListener('click', handleClearAll);
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', handleExportCSV);
  }

  if (btnToggleDetails && budgetDetails) {
    btnToggleDetails.addEventListener('click', () => {
      budgetDetails.classList.toggle('hidden');
      if (budgetDetails.classList.contains('hidden')) {
        btnToggleDetails.textContent = 'Ver Detalhes';
      } else {
        btnToggleDetails.textContent = 'Ocultar Detalhes';
      }
    });
  }
}

// Formatar moeda em Real (R$)
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Adicionar transação
function handleAddTransaction(e) {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const day = dayInput.value;
  const month = monthInput.value;
  const year = yearInput.value;

  if (!description || isNaN(amount) || amount <= 0 || !day || !month || !year) {
    showToast('Por favor, preencha todos os campos corretamente.', 'error');
    return;
  }

  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');

  const newTransaction = {
    id: Date.now(),
    description,
    amount,
    type,
    category,
    day: paddedDay,
    month: paddedMonth,
    year,
    date: `${year}-${paddedMonth}-${paddedDay}`
  };

  transactions.push(newTransaction);
  saveToLocalStorage();
  renderApp();

  // Reiniciar o formulário mantendo a data por defeito
  form.reset();
  setDefaultDateSelects();

  showToast('Transação adicionada com sucesso!', 'success');
}

// Remover transação individual
function handleDeleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  renderApp();
  showToast('Transação removida com sucesso.', 'info');
}

// Limpar todas as transações
function handleClearAll() {
  if (transactions.length === 0) {
    showToast('Não existem transações para apagar.', 'info');
    return;
  }

  if (confirm('Tem certeza que deseja apagar todas as transações do histórico?')) {
    transactions = [];
    saveToLocalStorage();
    renderApp();
    showToast('Todas as transações foram apagadas.', 'success');
  }
}

// Guardar no LocalStorage
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Obter transações filtradas
function getFilteredTransactions() {
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedMonth = filterMonthInput ? filterMonthInput.value : '';
  const selectedYear = filterYearInput ? filterYearInput.value : '';

  return transactions.filter(t => {
    // Filtro por descrição ou categoria
    const matchesSearch = t.description.toLowerCase().includes(searchVal) ||
                          t.category.toLowerCase().includes(searchVal);

    // Filtro por mês
    const matchesMonth = !selectedMonth || 
      String(t.month).padStart(2, '0') === String(selectedMonth).padStart(2, '0');

    // Filtro por ano
    const matchesYear = !selectedYear || String(t.year) === String(selectedYear);

    return matchesSearch && matchesMonth && matchesYear;
  });
}

// Atualizar toda a interface
function renderApp() {
  const filtered = getFilteredTransactions();
  renderSummary(filtered);
  renderTable(filtered);
  renderBudgetHealth(filtered);
  renderChart(filtered);
}

// Renderizar o resumo financeiro (Cards)
function renderSummary(dataList) {
  let entradas = 0;
  let saidas = 0;

  dataList.forEach(t => {
    if (t.type === 'entrada') {
      entradas += t.amount;
    } else {
      saidas += t.amount;
    }
  });

  const saldo = entradas - saidas;

  if (totalEntradasEl) totalEntradasEl.textContent = formatCurrency(entradas);
  if (totalSaidasEl) totalSaidasEl.textContent = formatCurrency(saidas);
  if (totalSaldoEl) {
    totalSaldoEl.textContent = formatCurrency(saldo);
    if (saldo < 0) {
      totalSaldoEl.style.color = '#ef4444';
    } else {
      totalSaldoEl.style.color = '';
    }
  }
}

// Renderizar Tabela do Histórico
function renderTable(dataList) {
  if (!transactionListEl) return;

  transactionListEl.innerHTML = '';

  if (dataList.length === 0) {
    transactionListEl.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #9ca3af; padding: 20px;">
          Nenhuma transação encontrada.
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por data (da mais recente para a mais antiga)
  const sorted = [...dataList].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(t => {
    const tr = document.createElement('tr');

    const formattedDate = `${t.day}/${t.month}/${t.year}`;
    const formattedAmount = formatCurrency(t.amount);
    const typeBadgeClass = t.type === 'entrada' ? 'badge-entrada' : 'badge-saida';
    const typeText = t.type === 'entrada' ? 'Entrada' : 'Saída';

    tr.innerHTML = `
      <td><strong>${escapeHtml(t.description)}</strong></td>
      <td style="color: ${t.type === 'entrada' ? '#22c55e' : '#ef4444'}; font-weight: bold;">
        ${t.type === 'entrada' ? '+' : '-'} ${formattedAmount}
      </td>
      <td><span class="${typeBadgeClass}">${typeText}</span></td>
      <td>${escapeHtml(t.category)}</td>
      <td>${formattedDate}</td>
      <td>
        <button class="btn-delete" onclick="handleDeleteTransaction(${t.id})" title="Apagar">
          🗑️
        </button>
      </td>
    `;

    transactionListEl.appendChild(tr);
  });
}

// Painel de Saúde Financeira
function renderBudgetHealth(dataList) {
  let entradas = 0;
  let saidas = 0;

  dataList.forEach(t => {
    if (t.type === 'entrada') entradas += t.amount;
    else saidas += t.amount;
  });

  let percentage = 0;
  if (entradas > 0) {
    percentage = Math.round((saidas / entradas) * 100);
  } else if (saidas > 0) {
    percentage = 100;
  }

  if (progressBarFill) {
    progressBarFill.style.width = `${Math.min(percentage, 100)}%`;
    if (percentage > 90) {
      progressBarFill.style.backgroundColor = '#ef4444';
    } else if (percentage > 70) {
      progressBarFill.style.backgroundColor = '#f59e0b';
    } else {
      progressBarFill.style.backgroundColor = '#22c55e';
    }
  }

  if (budgetPercentageText) {
    budgetPercentageText.textContent = `${percentage}% do orçamento utilizado`;
  }

  if (budgetStatusText) {
    if (percentage > 100) {
      budgetStatusText.textContent = 'Atenção: Orçamento Excedido!';
      budgetStatusText.style.color = '#ef4444';
    } else if (percentage > 80) {
      budgetStatusText.textContent = 'Alerta: Próximo do limite!';
      budgetStatusText.style.color = '#f59e0b';
    } else {
      budgetStatusText.textContent = 'Situação Estável';
      budgetStatusText.style.color = '#22c55e';
    }
  }

  // Lista dos Maiores Gastos
  if (topExpensesList) {
    const saidasOnly = dataList.filter(t => t.type === 'saida');
    const sortedExpenses = saidasOnly.sort((a, b) => b.amount - a.amount).slice(0, 3);

    topExpensesList.innerHTML = '';
    if (sortedExpenses.length === 0) {
      topExpensesList.innerHTML = '<li>Sem gastos registados</li>';
    } else {
      sortedExpenses.forEach(exp => {
        const li = document.createElement('li');
        li.textContent = `${exp.description} (${exp.category}): ${formatCurrency(exp.amount)}`;
        topExpensesList.appendChild(li);
      });
    }
  }

  // Média Diária de Gastos
  if (dailyAverageVal) {
    const saidasOnly = dataList.filter(t => t.type === 'saida');
    const totalSaidas = saidasOnly.reduce((acc, t) => acc + t.amount, 0);

    const uniqueDays = new Set(saidasOnly.map(t => t.date)).size || 1;
    const media = totalSaidas / uniqueDays;

    dailyAverageVal.textContent = `${formatCurrency(media)} / dia`;
  }
}

// Renderizar Gráfico por Categoria
function renderChart(dataList) {
  const canvas = document.getElementById('finance-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const categoriesMap = {};
  dataList.filter(t => t.type === 'saida').forEach(t => {
    categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(categoriesMap);
  const dataValues = Object.values(categoriesMap);

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (labels.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    chartInstance = null;
    return;
  }

  const ctx = canvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos por Categoria',
        data: dataValues,
        backgroundColor: [
          '#ef4444', '#3b82f6', '#f59e0b', '#10b981',
          '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
        ],
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#cbd5e1',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Exportar para ficheiro CSV
function handleExportCSV() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    showToast('Não há dados para exportar.', 'info');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // BOM para aceitar acentos no Excel
  csvContent += 'Descricao;Valor;Tipo;Categoria;Data\n';

  filtered.forEach(t => {
    const row = [
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      `${t.day}/${t.month}/${t.year}`
    ].join(';');
    csvContent += row + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `transacoes_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);

  showToast('Ficheiro CSV exportado com sucesso!', 'success');
}

// Mensagens Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Função para proteção de texto contra scripts maliciosos (XSS)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}