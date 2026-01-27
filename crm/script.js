// =====================================================
// SCRIPT CRM - Versão Supabase
// =====================================================

import { supabase, getAllLeads, createLead, updateLead, deleteLead } from './supabase-client.js';

// --- Configurações ---
const columnsConfig = [
  { id: "col1", title: "Primeiro Atendimento" },
  { id: "col2", title: "Orçamento Enviado" },
  { id: "col3", title: "Venda Pendente" },
  { id: "col4", title: "Venda Finalizada" },
  { id: "col5", title: "Aguardando Pagamento" },
  { id: "col6", title: "Venda Implantada / Pago" },
  { id: "cancelados", title: "Cancelados" },
];

const planos = [
  "N. P Individual co coparticipação Parcial",
  "N. P Individual co coparticipação Total",
  "Ambulatorial co coparticipação Parcial",
  "Ambulatorial co coparticipação Total",
  "N. P Empresarial co coparticipação Parcial",
  "N. P Empresarial co coparticipação Total",
  "Ambulatorial empresarial co coparticipação Parcial",
  "Ambulatorial empresarial co coparticipação Total",
  "Notrelife Ambulatorial Com Coparticipação Total",
  "Notrelife Ambulatorial Com Coparticipação Parcial",
  "Notrelife Com Coparticipação Total",
  "Notrelife Com Coparticipação Parcial",
  "Notrelife 50+ Com Coparticipação Total",
  "Notrelife 50+ Com Coparticipação Parcial",
  "Nosso Médico Leste Com Coparticipação Total",
  "Nosso Médico Leste Com Coparticipação Parcial",
  "Nosso Médico Norte Com Coparticipação Total",
  "Nosso Médico Norte Com Coparticipação Parcial",
  "Nosso Médico Sul Com Coparticipação Total",
  "Nosso Médico Sul Com Coparticipação Parcial",
  "Affix",
];

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Dados e Estado
let leads = [];
let filtroMesAtual = "all";
let termoBusca = "";

const board = document.getElementById("board");
const containerDependentes = document.getElementById("containerDependentes");
const monthTabsContainer = document.getElementById("monthTabs");

// --- Carregar Leads do Supabase ---
async function loadLeadsFromSupabase() {
  try {
    const data = await getAllLeads();
    
    // Converter formato do Supabase para formato do frontend
    leads = data.map(lead => ({
      id: lead.id,
      status: lead.status,
      venda: lead.data_venda,
      vencimento: lead.data_vencimento,
      titular: {
        nome: lead.titular_nome,
        cpf: lead.titular_cpf,
        nascimento: lead.titular_nascimento,
        cidade: lead.titular_cidade,
        telefone1: lead.titular_telefone1,
        telefone2: lead.titular_telefone2,
        plano: lead.titular_plano,
        valor: lead.titular_valor,
        desconto: lead.titular_desconto
      },
      dependentes: lead.dependentes || [],
      totalGeral: lead.total_geral
    }));
    
    renderTabs();
    renderBoard();
  } catch (error) {
    console.error('Erro ao carregar leads:', error);
    alert('Erro ao carregar dados. Verifique sua conexão.');
  }
}

// --- Função Principal: Renderizar Abas com Totais ---
function renderTabs() {
  const totaisPorMes = Array(12).fill(0);
  let totalGeralPago = 0;

  leads.forEach((lead) => {
    if (lead.status === "col6") {
      const dataParts = lead.venda.split("-");
      if (dataParts.length === 3) {
        const mesIndex = parseInt(dataParts[1]) - 1;
        if (mesIndex >= 0 && mesIndex <= 11) {
          totaisPorMes[mesIndex] += parseFloat(lead.totalGeral);
          totalGeralPago += parseFloat(lead.totalGeral);
        }
      }
    }
  });

  monthTabsContainer.innerHTML = "";

  const btnGeral = document.createElement("button");
  btnGeral.className = `tab-btn ${filtroMesAtual === "all" ? "active" : ""}`;
  btnGeral.onclick = () => filtrarMes("all");
  btnGeral.innerHTML = `<span class="tab-month">GERAL</span><span class="tab-value">${totalGeralPago.toLocaleString(
    "pt-BR",
    { style: "currency", currency: "BRL" }
  )}</span>`;
  monthTabsContainer.appendChild(btnGeral);

  nomesMeses.forEach((nome, index) => {
    const mesNumero = (index + 1).toString().padStart(2, "0");
    const valor = totaisPorMes[index];
    const btn = document.createElement("button");
    btn.className = `tab-btn ${filtroMesAtual === mesNumero ? "active" : ""}`;
    btn.onclick = () => filtrarMes(mesNumero);
    btn.innerHTML = `<span class="tab-month">${nome.substring(
      0,
      3
    )}</span><span class="tab-value">${valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}</span>`;
    monthTabsContainer.appendChild(btn);
  });
}

function filtrarMes(mes) {
  filtroMesAtual = mes;
  renderTabs();
  renderBoard();
}

window.filtrarBusca = function() {
  termoBusca = document.getElementById("searchInput").value.toLowerCase();
  renderBoard();
}

// --- Renderização do Board ---
function renderBoard() {
  board.innerHTML = "";

  let leadsFiltrados = leads.filter((l) => {
    if (filtroMesAtual === "all") return true;
    const mesVenda = l.venda.split("-")[1];
    return mesVenda === filtroMesAtual;
  });

  if (termoBusca) {
    leadsFiltrados = leadsFiltrados.filter((l) => {
      const nomeMatch = l.titular.nome.toLowerCase().includes(termoBusca);
      const cpfMatch = l.titular.cpf && l.titular.cpf.includes(termoBusca);
      return nomeMatch || cpfMatch;
    });
  }

  columnsConfig.forEach((col) => {
    const columnEl = document.createElement("div");
    columnEl.classList.add("column");
    columnEl.dataset.id = col.id;

    const colLeads = leadsFiltrados.filter((l) => l.status === col.id);
    const totalColuna = colLeads.reduce(
      (acc, curr) => acc + (parseFloat(curr.totalGeral) || 0),
      0
    );

    columnEl.innerHTML = `
            <div class="column-header">
                <div class="column-title">${col.title}</div>
                <div class="column-total">Total: <span class="total-value">${totalColuna.toLocaleString(
                  "pt-BR",
                  { style: "currency", currency: "BRL" }
                )}</span></div>
            </div>
            <div class="column-body" ondrop="drop(event)" ondragover="allowDrop(event)"></div>
        `;

    const bodyEl = columnEl.querySelector(".column-body");
    colLeads.forEach((lead) => bodyEl.appendChild(createCardElement(lead)));
    board.appendChild(columnEl);
  });
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function createCardElement(lead) {
  const div = document.createElement("div");
  div.classList.add("card");
  div.draggable = true;
  div.id = lead.id;
  div.ondragstart = drag;

  const valorFormatado = parseFloat(lead.totalGeral).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const qtdDep = lead.dependentes ? lead.dependentes.length : 0;
  const dataVenc = formatarData(lead.vencimento);

  div.innerHTML = `
        <div class="card-actions">
            <button class="icon-btn edit" onclick="editCard('${
              lead.id
            }')" title="Editar">
                <span class="material-icons">edit</span>
            </button>
            <button class="icon-btn delete" onclick="deleteCard('${
              lead.id
            }')" title="Excluir">
                <span class="material-icons">delete</span>
            </button>
        </div>
        <span class="vencimento-tag">📅 Vence: ${dataVenc}</span>
        <h4>${lead.titular.nome}</h4>
        <p><strong>CPF:</strong> ${lead.titular.cpf}</p>
        <p><strong>Plano:</strong> ${lead.titular.plano}</p>
        ${
          qtdDep > 0
            ? `<div class="badge-dep">+ ${qtdDep} Dependente(s)</div>`
            : ""
        }
        <span class="money">Total: ${valorFormatado}</span>
    `;
  return div;
}

// --- Drag and Drop ---
function allowDrop(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.add("drag-over");
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
  ev.target.classList.add("dragging");
}

document.addEventListener("dragend", (ev) => {
  document
    .querySelectorAll(".column-body")
    .forEach((el) => el.classList.remove("drag-over"));
  ev.target.classList.remove("dragging");
});

async function drop(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.remove("drag-over");
  const cardId = ev.dataTransfer.getData("text");
  const columnDiv = ev.currentTarget.closest(".column");
  if (columnDiv) {
    const leadIndex = leads.findIndex((l) => l.id == cardId);
    if (leadIndex > -1) {
      const newStatus = columnDiv.dataset.id;
      leads[leadIndex].status = newStatus;
      
      // Atualizar no Supabase
      await updateLead(cardId, { status: newStatus });
      
      renderTabs();
      renderBoard();
    }
  }
}

// Tornar funções globais
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;

// --- Funções Auxiliares (Modal, Forms) ---
function getPlanOptionsHTML(selected) {
  return planos
    .map(
      (p) =>
        `<option value="${p}" ${p === selected ? "selected" : ""}>${p}</option>`
    )
    .join("");
}
document.getElementById("titularPlano").innerHTML = getPlanOptionsHTML();

window.openModal = function() {
  document.getElementById("modalOverlay").style.display = "flex";
  document.getElementById("leadForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("modalTitle").textContent = "Novo Cadastro";
  containerDependentes.innerHTML = "";
  document.getElementById("displayTotalGeral").textContent = "R$ 0,00";
  const hoje = new Date().toISOString().split("T")[0];
  document.getElementById("dataVenda").value = hoje;
}

window.editCard = function(id) {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return;
  document.getElementById("editId").value = lead.id;
  document.getElementById("modalTitle").textContent = "Editar Cadastro";
  document.getElementById("dataVenda").value = lead.venda;
  document.getElementById("dataVencimento").value = lead.vencimento;
  document.getElementById("titularNome").value = lead.titular.nome;
  document.getElementById("titularCpf").value = lead.titular.cpf;
  document.getElementById("titularNascimento").value = lead.titular.nascimento;
  document.getElementById("cidade").value = lead.titular.cidade;
  document.getElementById("telefone1").value = lead.titular.telefone1 || "";
  document.getElementById("telefone2").value = lead.titular.telefone2 || "";
  document.getElementById("titularPlano").innerHTML = getPlanOptionsHTML(
    lead.titular.plano
  );
  document.getElementById("titularValor").value = lead.titular.valor;
  document.getElementById("titularDesconto").value = lead.titular.desconto;
  containerDependentes.innerHTML = "";
  if (lead.dependentes && lead.dependentes.length > 0) {
    lead.dependentes.forEach((dep) => addDependente(dep));
  }
  calcularTotalGeral();
  document.getElementById("modalOverlay").style.display = "flex";
}

window.closeModal = function() {
  document.getElementById("modalOverlay").style.display = "none";
}

window.addDependente = function(data = null) {
  const div = document.createElement("div");
  div.classList.add("dependente-item");
  const nomeVal = data ? data.nome : "";
  const cpfVal = data ? data.cpf : "";
  const nascVal = data ? data.nascimento : "";
  const valorVal = data ? data.valor : "";
  const descVal = data ? data.desconto : "";
  const planoSelected = data ? data.plano : "";
  div.innerHTML = `
        <button type="button" class="btn-remove-dep" onclick="removeDependente(this)">Excluir</button>
        <div class="form-group"><label>Nome</label><input type="text" class="dep-nome" value="${nomeVal}" required></div>
        <div class="form-row">
            <div class="form-group"><label>CPF</label><input type="text" class="dep-cpf" value="${cpfVal}"></div>
            <div class="form-group"><label>Nasc.</label><input type="date" class="dep-nasc" value="${nascVal}"></div>
        </div>
        <div class="form-group"><label>Plano</label><select class="dep-plano select-plano">${getPlanOptionsHTML(
          planoSelected
        )}</select></div>
        <div class="form-row">
            <div class="form-group"><label>Valor</label><input type="number" step="0.01" class="dep-valor calc-input" value="${valorVal}" oninput="calcularTotalGeral()"></div>
            <div class="form-group"><label>Desc.</label><input type="number" step="0.01" class="dep-desc calc-input" value="${descVal}" oninput="calcularTotalGeral()"></div>
        </div>
    `;
  containerDependentes.appendChild(div);
}

window.removeDependente = function(btn) {
  btn.closest(".dependente-item").remove();
  calcularTotalGeral();
}

window.calcularTotalGeral = function() {
  const tValor = parseFloat(document.getElementById("titularValor").value) || 0;
  const tDesc =
    parseFloat(document.getElementById("titularDesconto").value) || 0;
  let soma = tValor - tDesc;
  document.querySelectorAll(".dependente-item").forEach((div) => {
    const dValor = parseFloat(div.querySelector(".dep-valor").value) || 0;
    const dDesc = parseFloat(div.querySelector(".dep-desc").value) || 0;
    soma += dValor - dDesc;
  });
  document.getElementById("displayTotalGeral").textContent =
    soma.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return soma;
}

document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const editId = document.getElementById("editId").value;
  
  const titular = {
    nome: document.getElementById("titularNome").value,
    cpf: document.getElementById("titularCpf").value,
    nascimento: document.getElementById("titularNascimento").value,
    cidade: document.getElementById("cidade").value,
    telefone1: document.getElementById("telefone1").value,
    telefone2: document.getElementById("telefone2").value,
    plano: document.getElementById("titularPlano").value,
    valor: document.getElementById("titularValor").value,
    desconto: document.getElementById("titularDesconto").value,
  };
  
  const dependentesList = [];
  document.querySelectorAll(".dependente-item").forEach((div) => {
    dependentesList.push({
      nome: div.querySelector(".dep-nome").value,
      cpf: div.querySelector(".dep-cpf").value,
      nascimento: div.querySelector(".dep-nasc").value,
      plano: div.querySelector(".dep-plano").value,
      valor: div.querySelector(".dep-valor").value,
      desconto: div.querySelector(".dep-desc").value,
    });
  });
  
  const totalGeral = calcularTotalGeral();
  
  // Formato para Supabase
  const leadDataForSupabase = {
    data_venda: document.getElementById("dataVenda").value,
    data_vencimento: document.getElementById("dataVencimento").value,
    status: editId ? leads.find((l) => l.id === editId).status : "col1",
    titular_nome: titular.nome,
    titular_cpf: titular.cpf,
    titular_nascimento: titular.nascimento,
    titular_cidade: titular.cidade,
    titular_telefone1: titular.telefone1,
    titular_telefone2: titular.telefone2,
    titular_plano: titular.plano,
    titular_valor: parseFloat(titular.valor),
    titular_desconto: parseFloat(titular.desconto),
    dependentes: dependentesList,
    total_geral: totalGeral
  };
  
  try {
    if (editId) {
      // Atualizar lead existente
      const result = await updateLead(editId, leadDataForSupabase);
      if (result.success) {
        // Recarregar dados
        await loadLeadsFromSupabase();
        closeModal();
      } else {
        alert('Erro ao atualizar: ' + result.message);
      }
    } else {
      // Criar novo lead
      const result = await createLead(leadDataForSupabase);
      if (result.success) {
        // Recarregar dados
        await loadLeadsFromSupabase();
        closeModal();
      } else {
        alert('Erro ao criar: ' + result.message);
      }
    }
  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    alert('Erro ao salvar. Verifique sua conexão.');
  }
});

window.deleteCard = async function(id) {
  if (confirm("Tem certeza que deseja excluir este lead?")) {
    try {
      const result = await deleteLead(id);
      if (result.success) {
        await loadLeadsFromSupabase();
      } else {
        alert('Erro ao excluir: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      alert('Erro ao excluir. Verifique sua conexão.');
    }
  }
}

// Inicializar carregando dados do Supabase
loadLeadsFromSupabase();
