const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function mostrarMsg(texto, tipo = 'sucesso') {
	const f = $('#feedback');
	if (!f) return;
	f.textContent = texto;
	f.style.display = 'block';
	f.style.backgroundColor = tipo === 'sucesso' ? '#dcfce7' : '#fee2e2';
	f.style.color = tipo === 'sucesso' ? '#166534' : '#991b1b';
}

function configurarCamposExtras() {
	const gerenciar = (idSelect, idBox, label) => {
		const el = $(idSelect);
		if (!el) return;
		el.addEventListener('change', e => {
			if (e.target.value === 'Sim') {
				if (!$(`#${idBox}`)) {
					const div = document.createElement('div');
					div.id = idBox;
					div.className = "info-panel";

					const labelElement = document.createElement("label");
					labelElement.textContent = label;

					const inputElement = document.createElement("input");
					inputElement.id = "input" + idBox;
					inputElement.placeholder = "Descreva aqui...";
					inputElement.style.marginTop = "5px";

					div.appendChild(labelElement);
					div.appendChild(inputElement);
					$('#extras').appendChild(div);
				}
			} else {
				$(`#${idBox}`)?.remove();
			}
		});
	};

	gerenciar('#alergia', 'boxAlergia', 'Detalhes da Alergia');
	gerenciar('#pcd', 'boxPcd', 'Detalhes da Deficiência');
}

document.addEventListener('DOMContentLoaded', () => {
	console.log("Script carregado");

	configurarCamposExtras();

	$('#btnTestarConexao').onclick = async () => {
		const btn = $('#btnTestarConexao');
		btn.textContent = "⌛...";
		try {
			const r = await fetch('/api/test');
			const res = await r.json();
			mostrarMsg(res.ok
				? "✅ Conexão com o banco de dados no back-end está OK!"
				: "❌ Conexão com o banco de dados no back-end não está OK!",
				res.ok ? 'sucesso' : 'erro'
			);
		} catch (e) {
			mostrarMsg("❌ Erro não identificado", "erro");
		} finally {
			btn.textContent = "🔗 Testar conexão com banco de dados";
		}
	};


$('#btnCadastrar').onclick = async () => {
	const data = {
		nome: $('#nome').value.trim(),
		dia: $('#dia').value,
		mes: $('#mes').value,
		ano: $('#ano').value,
		responsavel: $('#responsavel').value,
		cep: $('#cep').value,
		area: $('#area').value,
		serie: $('#serie').value,
		alergia: $('#alergia').value,
		detalheAlergia: $('#inputboxAlergia')?.value || "Nenhum",
		pcd: $('#pcd').value,
		detalhePcd: $('#inputboxPcd')?.value || "Nenhum"
	};
	if (!data.nome || !data.dia) return alert("Todos os campos devem estar preenchidos.");
	try {
		const r = await fetch('/api/cadastrar', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const res = await r.json();
		if (res.ok) {
			mostrarMsg("✅ Cadastrado! Realize o quiz para não ficar sem nota!");
			$('#formCadastro').reset();
			$('#extras').innerHTML = '';
		} else {
			mostrarMsg(`❌ ${res.erro}`, 'erro');
		}
	} catch (e) {
		mostrarMsg("❌ Erro não identificado", "erro");
	}
};

$('#btnVerAlunos').onclick = async () => {
	const resDiv = $('#resultado');
	resDiv.style.display = 'block';
	resDiv.innerHTML = "⌛ Carregando...";
	try {
		const r = await fetch('/api/alunos');
		const res = await r.json();
		if (res.ok && res.alunos.length > 0) {
			resDiv.innerHTML = '';
			res.alunos.forEach(a => {
				const panel = document.createElement("div");
				panel.classList.add("info-panel");
				panel.style.borderLeft = "4px solid var(--accent-2)";
				panel.innerHTML = `<strong>${a.Nome}</strong><br><small>${a.Área} | Série: ${a.Série}</small>`;
				resDiv.appendChild(panel);
			});
		} else {
			resDiv.innerHTML = "Nenhum aluno encontrado.";
		}
	} catch (e) {
		resDiv.innerHTML = "❌ Erro ao carregar.";
	}
};

$('#btnQuiz').onclick = async () => {
	let nomeAluno = prompt("Digite seu nome como está escrito no seu cadastro:");
	let areaInput = prompt("Digite a área (Redes De Computadores, Administração ou Enfermagem):");
	let serieNum = prompt("Digite a Série (ex: 1° Série):");

	if (!nomeAluno || !areaInput || !serieNum) return;

	const areaNormalizada = areaInput.trim().toUpperCase().replace(/\s+/g, '');

	let areaFinal = "";
	if (areaNormalizada.includes("REDES")) areaFinal = "Redes De Computadores";
	else if (areaNormalizada.includes("ADMINISTRAÇÃO") || areaNormalizada.includes("ADM")) areaFinal = "Administração";
	else if (areaNormalizada.includes("ENFERMAGEM")) areaFinal = "Enfermagem";
	else areaFinal = areaInput.trim();

	const serieParaEnviar = serieNum.trim();
	let perguntas = [];

	if (areaFinal === "Redes De Computadores") {
				perguntas = [
						{
								q: "Qual linguagem de programação é amplamente utilizada em cursos técnicos de redes para automação e scripts?",
								options: ["PHP", "Python", "Java", "Portugol"],
								correta: "Python"
						},
						{
								q: "A máscara de sub-rede 255.255.255.0 corresponde a qual prefixo CIDR?",
								options: ["/8", "/12", "/24", "/28"],
								correta: "/24"
						},
						{
								q: "Qual protocolo da camada de transporte garante entrega confiável, controle de fluxo e retransmissão?",
								options: ["TCP", "UDP", "ICMP", "ARP"],
								correta: "TCP"
						},
						{
								q: "Uma LAN (Local Area Network) é caracterizada por:",
								options: [
										"Cobrir uma pequena área geográfica, como uma casa ou empresa",
										"Interligar continentes",
										"Funcionar exclusivamente na internet",
										"Operar apenas por satélite"
								],
								correta: "Cobrir uma pequena área geográfica, como uma casa ou empresa"
						},
						{
								q: "Qual meio físico transmite dados por pulsos de luz?",
								options: [
										"Cabo coaxial",
										"Cabo par trançado",
										"Fibra óptica",
										"Cabo T568A"
								],
								correta: "Fibra óptica"
						},
						{
								q: "Qual é a principal função de um switch em uma rede local?",
								options: [
										"Roteamento entre redes diferentes",
										"Encaminhar quadros com base no endereço MAC",
										"Distribuir IP automaticamente",
										"Converter sinal analógico em digital"
								],
								correta: "Encaminhar quadros com base no endereço MAC"
						},
						{
								q: "Qual protocolo permite navegação web segura utilizando criptografia TLS?",
								options: ["FTP", "SMTP", "HTTP", "HTTPS"],
								correta: "HTTPS"
						},
						{
								q: "Qual tecnologia permite que múltiplos dispositivos compartilhem um único endereço IP público?",
								options: ["DNS", "FTP", "VPN", "NAT"],
								correta: "NAT"
						},
						{
								q: "Qual dos seguintes sistemas operacionais é de código aberto?",
								options: ["Windows 11", "macOS Ventura", "Ubuntu", "iOS"],
								correta: "Ubuntu"
						},
						{
								q: "Qual comando em Python é utilizado para exibir saída no terminal?",
								options: ["echo", "print", "printf", "System.out.println"],
								correta: "print"
						}
				];

		} else if (areaFinal === "Administração") {

				perguntas = [
						{
								q: "Qual das seguintes NÃO é uma função clássica da administração?",
								options: ["Planejar", "Organizar", "Dirigir", "Controlar"],
								correta: "Dirigir"
						},
						{
								q: "A ferramenta SWOT analisa quais fatores?",
								options: [
										"Forças, Fraquezas, Oportunidades, Ameaças",
										"Lucro, Vendas, Marketing, RH",
										"Preço, Praça, Produto, Promoção",
										"Missão, Visão, Valores, Metas"
								],
								correta: "Forças, Fraquezas, Oportunidades, Ameaças"
						},
						{
								q: "O que significa a sigla PDCA na gestão de qualidade?",
								options: [
										"Planejar, Fazer, Checar, Agir",
										"Produzir, Distribuir, Comprar, Armazenar",
										"Pesquisar, Desenvolver, Criar, Analisar",
										"Parar, Descansar, Começar, Acabar"
								],
								correta: "Planejar, Fazer, Checar, Agir"
						},
						{
								q: "Na hierarquia empresarial, quem define a estratégia global?",
								options: [
										"Nível Estratégico (Diretoria)",
										"Nível Tático (Gerência)",
										"Nível Operacional (Supervisão)",
										"Nível Técnico (Execução)"
								],
								correta: "Nível Estratégico (Diretoria)"
						},
						{
								q: "Qual documento registra todas as entradas e saídas financeiras?",
								options: [
										"Fluxo de Caixa",
										"Contrato Social",
										"Holerite",
										"Ata de Reunião"
								],
								correta: "Fluxo de Caixa"
						},
						{
								q: "O que são os 4Ps do Marketing?",
								options: [
										"Produto, Preço, Praça, Promoção",
										"Pessoas, Processos, Provas, Planos",
										"Pesquisa, Planejamento, Produção, Publicidade",
										"Paixão, Propósito, Performance, Pagamento"
								],
								correta: "Produto, Preço, Praça, Promoção"
						},
						{
								q: "Qual a carga horária padrão semanal segundo a CLT?",
								options: ["44 horas", "40 horas", "48 horas", "36 horas"],
								correta: "44 horas"
						},
						{
								q: "O que é um Passivo na contabilidade?",
								options: [
										"Obrigações e dívidas da empresa",
										"Bens e direitos",
										"Dinheiro em caixa",
										"Investimentos"
								],
								correta: "Obrigações e dívidas da empresa"
						},
						{
								q: "O que é Brainstorming?",
								options: [
										"Tempestade de ideias em grupo",
										"Uma demissão em massa",
										"Um software de gestão",
										"Uma técnica de vendas"
								],
								correta: "Tempestade de ideias em grupo"
						},
						{
								q: "Qual setor cuida do transporte e armazenamento de produtos?",
								options: ["Logística", "Recursos Humanos", "Marketing", "Financeiro"],
								correta: "Logística"
						}
				];

		} else if (areaFinal === "Enfermagem") {

				perguntas = [
						{
								q: "Qual via de administração de medicamento proporciona efeito sistêmico mais rápido em situações de emergência?",
								options: [
										"Intravenosa (IV)",
										"Oral (VO)",
										"Subcutânea (SC)",
										"Intramuscular (IM)"
								],
								correta: "Intravenosa (IV)"
						},
						{
								q: "Qual é o principal objetivo da Sistematização da Assistência de Enfermagem (SAE)?",
								options: [
										"Organizar e padronizar o cuidado ao paciente",
										"Reduzir o número de profissionais",
										"Substituir o diagnóstico médico",
										"Aumentar a rotatividade de leitos"
								],
								correta: "Organizar e padronizar o cuidado ao paciente"
						},
						{
								q: "Quais são os quatro sinais vitais clássicos?",
								options: [
										"Pressão arterial, frequência cardíaca, frequência respiratória e temperatura",
										"Altura, peso, glicemia e dor",
										"Pulso, sudorese, glicose e reflexo pupilar",
										"Pressão arterial, dor, peso e altura"
								],
								correta: "Pressão arterial, frequência cardíaca, frequência respiratória e temperatura"
						},
						{
								q: "Qual é a principal finalidade da técnica asséptica?",
								options: [
										"Prevenir infecções e contaminações",
										"Reduzir custos hospitalares",
										"Acelerar a alta médica",
										"Evitar registros em prontuário"
								],
								correta: "Prevenir infecções e contaminações"
						},
						{
								q: "Na classificação de risco em serviços de urgência, a triagem tem como finalidade:",
								options: [
										"Priorizar o atendimento conforme gravidade",
										"Definir o diagnóstico médico final",
										"Determinar o tempo de internação",
										"Autorizar procedimentos cirúrgicos"
								],
								correta: "Priorizar o atendimento conforme gravidade"
						},
						{
								q: "Qual complicação é mais associada à administração incorreta de medicamentos intravenosos?",
								options: [
										"Flebite",
										"Hipoglicemia leve",
										"Dermatite de contato",
										"Otite média"
								],
								correta: "Flebite"
						},
						{
								q: "Durante a RCP em adulto, segundo diretrizes atuais, a relação compressão/ventilação para profissional de saúde é:",
								options: ["30:2", "15:2", "50:5", "Apenas ventilações"],
								correta: "30:2"
						},
						{
								q: "Qual é o valor de pressão arterial considerado hipertensão em adultos, segundo parâmetros clínicos tradicionais?",
								options: [
										"≥ 140x90 mmHg",
										"120x80 mmHg",
										"100x60 mmHg",
										"110x70 mmHg"
								],
								correta: "≥ 140x90 mmHg"
						},
						{
								q: "O balanço hídrico tem como objetivo principal:",
								options: [
										"Monitorar entradas e saídas de líquidos do paciente",
										"Avaliar apenas ingestão alimentar",
										"Controlar temperatura corporal",
										"Registrar medicações aplicadas"
								],
								correta: "Monitorar entradas e saídas de líquidos do paciente"
						},
						{
								q: "O sigilo profissional na enfermagem está relacionado principalmente a:",
								options: [
										"Proteção das informações do paciente",
										"Resguardar dados financeiros do hospital",
										"Impedir comunicação entre equipes",
										"Evitar registros clínicos"
								],
								correta: "Proteção das informações do paciente"
						}
				];
		}

		if(perguntas.length === 0) return alert("Área inválida.");
		const qSecao = $('#quizSecao');
		qSecao.style.display = 'block';
		qSecao.innerHTML = `<h3>📝 Provão: ${areaFinal}</h3>` +
				perguntas.map((p, i) => `
						<div class="pergunta-item">
								<p><strong>${i+1}. ${p.q}</strong></p>
								${p.options.map(opt => `<label class="opcao-item"><input type="radio" name="q${i}" value="${opt}"> ${opt}</label>`).join('')}
						</div>`).join('') + `<button class="btn" id="finishQ">Enviar Quiz</button>`;
		$('#finishQ').onclick = async () => {
				let respostas = {};
				perguntas.forEach((p, i) => {
						const sel = $(`input[name="q${i}"]:checked`);
						respostas[i] = sel ? (sel.value === p.correta ? "correta" : "errada") : "errada";});
				try {
						const r = await fetch('/api/quiz', {
								method: 'POST',
								headers: {'Content-Type': 'application/json'},
								body: JSON.stringify({
										nome: nomeAluno.trim(),
										area: areaFinal,
										serie: serieParaEnviar,
										respostas: respostas})});
						const res = await r.json();
						if(res.ok) {
								alert(`✅ Nota: ${res.pontuacao}`);
								qSecao.style.display = 'none';} 
						else {
								alert(`⚠️ Servidor diz: ${res.mensagem || res.erro}`);}} 
				catch(e) {
						alert("Erro de conexão com a API.");}};};
$('#btnQualificado').onclick = async () => {
		try {
			const r = await fetch('/api/qualificados');
			const res = await r.json();
			let html = Object.entries(res.qualificados)
				.map(([a, d]) => `<div class="info-panel"><strong>${a}:</strong> ${d.qualificados} qualificados</div>`)
				.join('');
			html += `<div style="margin-top:15px; background:var(--accent); color:white; padding:15px; border-radius:12px; text-align:center">
						<div>
							<small>ALUNOS EM TODOS OS CURSOS</small>
							<div style="font-size:2rem; font-weight:800">${res.porcentagem_geral}%</div>
						</div>
					 </div>`;
			$('#qualificadosConteudo').innerHTML = html;
			$('#modalQualificados').classList.add('open');
		} catch (e) {
			alert("Erro ao carregar ranking.");
		}
	};

	// Modais
	$('#btnCursos').onclick = () => $('#modalCursos').classList.add('open');
	$('#btnInfo').onclick = () => $('#modalInfo').classList.add('open');
	$('#btnSuporte').onclick = () => $('#modalSuporte').classList.add('open');
	$$('.modal .close').forEach(b => b.onclick = () => b.closest('.modal').classList.remove('open'));
});