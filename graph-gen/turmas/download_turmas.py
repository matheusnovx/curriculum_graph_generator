import requests
import json
import os

# URL do endpoint
url = "https://sisacad.inf.ufsc.br/modules/curriculo/exporta.php"

# Cabeçalhos para simular um navegador
headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://sisacad.inf.ufsc.br/modules/curriculo/",
    "Origin": "https://sisacad.inf.ufsc.br",
}

# Todos os códigos dos cursos (retirados do <option>)
codigos_curso = [
    "301","316","501","555","455","337","207","335","451","324","342","349","601","503","108","110","302","317","208","304","318","310","320","450","454","453","452","420","303","5","717","703","715","705","702","714","713","708","707","709","716","711","710","334","444","404","12","101","602","603","201","607","215","234","655","220","754","653","233","753","236","237","212","213","214","608","202","235","604","553","203","605","606","216","211","755","102","328","329","323","307","2","225","654","109","331","332","336","326","327","344","347","343","346","345","348","341","415","428","426","421","461","460","462","423","464","463","465","424","467","466","468","425","470","469","471","427","473","472","474","441","440","222","223","224","751","756","103","656","556","552","230","338","9","333","104","308","319","226","3","205","752","757","227","340","429","309","339","238","652","651","502"
]

# Pasta para salvar
output_dir = "curriculos_20252"
os.makedirs(output_dir, exist_ok=True)

for codigo in codigos_curso:
    params = {
        "codigo_curso": codigo,
        "periodo": "20252",  # 2025-2
        "export_turmas": "Exportar Turmas",
    }

    try:
        resp = requests.post(url, headers=headers, data=params, timeout=15)
        if resp.status_code == 200 and resp.text.strip():
            filename = os.path.join(output_dir, f"turmas_curso_{codigo}.json")
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(resp.json(), f, ensure_ascii=False, indent=2)
            print(f"✅ Baixado: {filename}")
        else:
            print(f"⚠️ Falhou {codigo} -> Status {resp.status_code}")
    except Exception as e:
        print(f"❌ Erro no curso {codigo}: {e}")
