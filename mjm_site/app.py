from replit.object_storage import Client
client = Client()
from flask import Flask, request, jsonify, render_template
import requests, random, os
from datetime import datetime
from flask import Flask

app = Flask(__name__, template_folder="template", static_folder="static")
FIREBASE_BASE = "https://bancodedadosmjm-default-rtdb.firebaseio.com/"


def gerar_matricula():
	return random.randint(10000, 99999)


def email_institucional(nome, idade, dominio="aluno.gov.ce"):
	partes = nome.strip().split()
	if not partes:
		return ""
	primeiro = partes[0].lower()
	ultimo = partes[-1].lower() if len(partes) > 1 else primeiro
	return f"{primeiro}.{ultimo}{idade}@{dominio}"


def calcular_idade(dia, mes, ano):
	try:
		nasc = datetime(int(ano), int(mes), int(dia))
		hoje = datetime.now()
		idade = hoje.year - nasc.year - (
		    (hoje.month, hoje.day) < (nasc.month, nasc.day))
		return idade
	except:
		return None


def obter_dados_db(path=""):
	try:
		clean_path = path.strip("/")
		r = requests.get(f"{FIREBASE_BASE}{clean_path}.json", timeout=5)
		return r.json() if r.status_code == 200 else {}
	except:
		return {}


@app.route("/")
def index():
	return render_template("index.html")


@app.route("/api/test", methods=["GET"])
def api_test():
	try:
		r = requests.get(f"{FIREBASE_BASE}.json", timeout=5)
		return jsonify({"ok": r.status_code == 200})
	except:
		return jsonify({"ok": False}), 500


@app.route("/api/cadastrar", methods=["POST"])
def api_cadastrar():
	data = request.get_json() or {}
	nome = str(data.get("nome", "")).strip()

	nome_sem_espacos = nome.replace(" ", "")
	if len(nome_sem_espacos) < 10:
		return jsonify({
		    "erro":
		    "O nome deve conter pelo menos 10 letras (sem contar espaços)."
		}), 400

	dia, mes, ano = data.get("dia"), data.get("mes"), data.get("ano")
	area = data.get("area")
	serie_num = data.get("serie")
	serie_label = f"{serie_num}° Série" if "Série" not in str(
	    serie_num) else str(serie_num)

	idade = calcular_idade(dia, mes, ano)
	if not nome or idade is None:
		return jsonify({"erro": "Dados inválidos"}), 400

	matricula = gerar_matricula()
	aluno_data = {
	    "Nome": nome,
	    "Idade": idade,
	    "Email": email_institucional(nome, idade),
	    "Responsavel": data.get("responsavel"),
	    "CEP": data.get("cep"),
	    "Alergia": data.get("detalheAlergia", "Nenhum"),
	    "PCD": data.get("detalhePcd", "Nenhum"),
	    "Matricula": matricula,
	    "Área": area,
	    "Série": serie_label,
	    "Quiz": {
	        "Respondido": False,
	        "Nota": 0
	    }
	}
	url = f"{FIREBASE_BASE}{area}/{serie_label}/{nome}.json"
	try:
		requests.put(url, json=aluno_data, timeout=8)
		return jsonify({
		    "ok": True,
		    "mensagem": "Cadastrado!",
		    "matricula": matricula
		})
	except:
		return jsonify({"erro": "Erro ao salvar no Firebase"}), 500


@app.route("/api/quiz", methods=["POST"])
def api_quiz():
	data = request.get_json() or {}
	nome_aluno = str(data.get("nome", "")).strip()
	area = data.get("area")
	serie = str(data.get("serie", "")).strip()
	respostas = data.get("respostas") or {}
	path = f"{area}/{serie}/{nome_aluno}"
	aluno = obter_dados_db(path)
	if not aluno or "Nome" not in aluno:
		return jsonify({
		    "ok":
		    False,
		    "mensagem":
		    f"Aluno '{nome_aluno}' não encontrado em {serie}!"
		}), 404
	if aluno.get("Quiz", {}).get("Respondido"):
		return jsonify({
		    "ok": False,
		    "mensagem": "Você já realizou este quiz."
		}), 403
	total = len(respostas)
	corretas = sum(1 for r in respostas.values() if r == "correta")
	pontuacao = round((corretas / total) * 10, 1) if total > 0 else 0
	situacao = "qualificado" if pontuacao >= 8 else "bom" if pontuacao >= 6 else "ruim"
	quiz_update = {
	    "Nota": pontuacao,
	    "Situacao": situacao,
	    "Respondido": True,
	    "Data_Realizacao": datetime.now().strftime("%d/%m/%Y %H:%M")
	}
	try:
		url = f"{FIREBASE_BASE}{path}/Quiz.json"
		requests.patch(url, json=quiz_update, timeout=5)
		return jsonify({
		    "ok": True,
		    "pontuacao": pontuacao,
		    "situacao": situacao
		})
	except:
		return jsonify({"ok": False, "mensagem": "Erro ao salvar nota"}), 500


@app.route("/api/alunos", methods=["GET"])
def api_alunos():
	db = obter_dados_db()
	alunos_list = []
	if not db or not isinstance(db, dict):
		return jsonify({"ok": True, "alunos": []})

	for area_n, series in db.items():
		if not isinstance(series, dict):
			continue
		for s_nome, alunos in series.items():
			if not isinstance(alunos, dict):
				continue
			for nome_chave, info in alunos.items():
				if isinstance(info, dict):
					alunos_list.append({
					    "Nome":
					    info.get("Nome", nome_chave),
					    "Área":
					    area_n,
					    "Série":
					    s_nome,
					    "Matricula":
					    info.get("Matricula",
					             info.get("Número da matricula", "N/A"))
					})
	return jsonify({"ok": True, "alunos": alunos_list})


@app.route("/api/qualificados", methods=["GET"])
def api_qualificados():
	db = obter_dados_db()
	if not db:
		return jsonify({"ok": False, "mensagem": "Banco vazio"}), 200
	resumo = {}
	total_escola = 0
	qualificados_escola = 0
	for area, series in db.items():
		if not isinstance(series, dict):
			continue
		count_q, total_a = 0, 0
		for s_nome, alunos in series.items():
			if not isinstance(alunos, dict):
				continue
			for nome_chave, info in alunos.items():
				if isinstance(info, dict):
					total_a += 1
					total_escola += 1
					if info.get("Quiz", {}).get("Nota", 0) >= 8:
						count_q += 1
						qualificados_escola += 1
		resumo[area] = {"qualificados": count_q, "total": total_a}
	porcentagem = round((qualificados_escola / total_escola *
	                     100), 1) if total_escola > 0 else 0
	return jsonify({
	    "ok": True,
	    "qualificados": resumo,
	    "total_geral": total_escola,
	    "qualificados_geral": qualificados_escola,
	    "porcentagem_geral": porcentagem
	})


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
