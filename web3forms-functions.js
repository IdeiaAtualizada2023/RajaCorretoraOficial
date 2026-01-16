// Funções JavaScript para envio com Web3Forms
// Envia dados do formulário por e-mail via Web3Forms

// Função para enviar lead do formulário principal
async function enviarLeadWhatsApp(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonHTML = submitButton.innerHTML;
  
  // Desabilita botão durante envio
  submitButton.disabled = true;
  submitButton.textContent = 'Enviando...';
  
  try {
    // Enviar para Web3Forms (email)
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirecionar para página de obrigado
      window.location.href = 'obrigado.html';
    } else {
      throw new Error('Erro ao enviar formulário');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao enviar formulário. Por favor, tente novamente.');
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonHTML;
  }
  
  return false;
}

// Função para enviar formulário de cotação do rodapé
async function enviarCotacaoWhatsApp(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('input[type="submit"]');
  
  // Desabilita botão durante envio
  submitButton.disabled = true;
  submitButton.value = 'Enviando...';
  
  try {
    // Enviar para Web3Forms (email)
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirecionar para página de obrigado
      window.location.href = 'obrigado.html';
    } else {
      throw new Error('Erro ao enviar formulário');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao enviar formulário. Por favor, tente novamente.');
    submitButton.disabled = false;
    submitButton.value = 'COTAÇÃO';
  }
  
  return false;
}
