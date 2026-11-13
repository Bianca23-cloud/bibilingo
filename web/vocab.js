/* Bibilingo 2.0 – langues et vocabulaire de base (15 langues). Traductions rédigées pour Bibilingo. */
"use strict";
var BIBI_LANGS = [
  { id: "fr",   label: "Français (France)",      short: "FR",    tts: "fr-FR", mt: "fr", script: "latin" },
  { id: "ro",   label: "Roumain (Roumanie)",     short: "RO",    tts: "ro-RO", mt: "ro", script: "latin" },
  { id: "en",   label: "Anglais (Royaume-Uni)",  short: "EN-GB", tts: "en-GB", mt: "en", script: "latin" },
  { id: "ptBR", label: "Portugais (Brésil)",     short: "PT-BR", tts: "pt-BR", mt: "pt", script: "latin" },
  { id: "ptPT", label: "Portugais (Portugal)",   short: "PT-PT", tts: "pt-PT", mt: "pt", script: "latin" },
  { id: "it",   label: "Italien (Italie)",       short: "IT",    tts: "it-IT", mt: "it", script: "latin" },
  { id: "esES", label: "Espagnol (Espagne)",     short: "ES",    tts: "es-ES", mt: "es", script: "latin" },
  { id: "esMX", label: "Espagnol (Mexique)",     short: "MX",    tts: "es-MX", mt: "es", script: "latin" },
  { id: "esAR", label: "Espagnol (Argentine)",   short: "AR",    tts: "es-AR", mt: "es", script: "latin" },
  { id: "el",   label: "Grec",                   short: "EL",    tts: "el-GR", mt: "el", script: "greek" },
  { id: "de",   label: "Allemand",               short: "DE",    tts: "de-DE", mt: "de", script: "latin" },
  { id: "ru",   label: "Russe",                  short: "RU",    tts: "ru-RU", mt: "ru", script: "cyrillic" },
  { id: "ja",   label: "Japonais",               short: "JA",    tts: "ja-JP", mt: "ja", script: "japanese" },
  { id: "zh",   label: "Chinois (mandarin)",     short: "ZH",    tts: "zh-CN", mt: "zh", script: "han" },
  { id: "nl",   label: "Néerlandais",            short: "NL",    tts: "nl-NL", mt: "nl", script: "latin" }
];

var BIBI_THEMES = [
  { id: "salut",   label: "👋 Salutations" },
  { id: "parler",  label: "💬 Se comprendre" },
  { id: "quest",   label: "❓ Questions" },
  { id: "travail", label: "💼 Travail" },
  { id: "quotid",  label: "☕ Quotidien" },
  { id: "urgence", label: "🆘 Urgences" },
  { id: "nombres", label: "🔢 Nombres" },
  { id: "jours",   label: "📅 Jours" }
];

/* Colonnes : thème, fr, ro, en, ptBR, ptPT, it, esES, esMX, esAR, el, de, ru, ja, ja (rōmaji), zh, zh (pinyin), nl */
var BIBI_COLS = ["fr","ro","en","ptBR","ptPT","it","esES","esMX","esAR","el","de","ru","ja","jaT","zh","zhT","nl"];
var BIBI_ROWS = [
 ["salut","Bonjour.","Bună ziua.","Hello.","Olá, bom dia.","Olá, bom dia.","Buongiorno.","Buenos días.","Buenos días.","Buen día.","Καλημέρα.","Guten Tag.","Здравствуйте.","こんにちは。","Konnichiwa.","你好。","Nǐ hǎo.","Goedendag."],
 ["salut","Bonsoir.","Bună seara.","Good evening.","Boa noite.","Boa noite.","Buonasera.","Buenas noches.","Buenas noches.","Buenas noches.","Καλησπέρα.","Guten Abend.","Добрый вечер.","こんばんは。","Konbanwa.","晚上好。","Wǎnshang hǎo.","Goedenavond."],
 ["salut","Au revoir.","La revedere.","Goodbye.","Tchau.","Adeus.","Arrivederci.","Adiós.","Adiós.","Chau.","Αντίο.","Auf Wiedersehen.","До свидания.","さようなら。","Sayōnara.","再见。","Zàijiàn.","Tot ziens."],
 ["salut","Merci.","Mulțumesc.","Thank you.","Obrigado.","Obrigado.","Grazie.","Gracias.","Gracias.","Gracias.","Ευχαριστώ.","Danke.","Спасибо.","ありがとうございます。","Arigatō gozaimasu.","谢谢。","Xièxie.","Dank u."],
 ["salut","S'il vous plaît.","Vă rog.","Please.","Por favor.","Por favor.","Per favore.","Por favor.","Por favor.","Por favor.","Παρακαλώ.","Bitte.","Пожалуйста.","お願いします。","Onegaishimasu.","请。","Qǐng.","Alstublieft."],
 ["salut","Excusez-moi.","Scuzați-mă.","Excuse me.","Com licença.","Com licença.","Mi scusi.","Disculpe.","Disculpe.","Disculpe.","Με συγχωρείτε.","Entschuldigung.","Извините.","すみません。","Sumimasen.","对不起。","Duìbuqǐ.","Pardon."],
 ["salut","Oui.","Da.","Yes.","Sim.","Sim.","Sì.","Sí.","Sí.","Sí.","Ναι.","Ja.","Да.","はい。","Hai.","是。","Shì.","Ja."],
 ["salut","Non.","Nu.","No.","Não.","Não.","No.","No.","No.","No.","Όχι.","Nein.","Нет.","いいえ。","Iie.","不。","Bù.","Nee."],
 ["salut","Bonne journée !","O zi bună!","Have a nice day!","Tenha um bom dia!","Tenha um bom dia!","Buona giornata!","¡Que tenga un buen día!","¡Que tenga un buen día!","¡Que tenga un buen día!","Καλή σας μέρα!","Einen schönen Tag noch!","Хорошего дня!","よい一日を！","Yoi ichinichi o!","祝您今天愉快！","Zhù nín jīntiān yúkuài!","Fijne dag nog!"],

 ["parler","Je m'appelle Ana.","Mă numesc Ana.","My name is Ana.","Meu nome é Ana.","Chamo-me Ana.","Mi chiamo Ana.","Me llamo Ana.","Me llamo Ana.","Me llamo Ana.","Με λένε Άνα.","Ich heiße Ana.","Меня зовут Ана.","私の名前はアナです。","Watashi no namae wa Ana desu.","我叫安娜。","Wǒ jiào Ānnà.","Ik heet Ana."],
 ["parler","Je viens de Roumanie.","Sunt din România.","I am from Romania.","Sou da Romênia.","Sou da Roménia.","Vengo dalla Romania.","Soy de Rumanía.","Soy de Rumania.","Soy de Rumania.","Είμαι από τη Ρουμανία.","Ich komme aus Rumänien.","Я из Румынии.","ルーマニアから来ました。","Rūmania kara kimashita.","我来自罗马尼亚。","Wǒ láizì Luómǎníyà.","Ik kom uit Roemenië."],
 ["parler","Je parle français et roumain.","Vorbesc franceză și română.","I speak French and Romanian.","Eu falo francês e romeno.","Falo francês e romeno.","Parlo francese e rumeno.","Hablo francés y rumano.","Hablo francés y rumano.","Hablo francés y rumano.","Μιλάω γαλλικά και ρουμανικά.","Ich spreche Französisch und Rumänisch.","Я говорю по-французски и по-румынски.","フランス語とルーマニア語を話します。","Furansugo to Rūmaniago o hanashimasu.","我会说法语和罗马尼亚语。","Wǒ huì shuō Fǎyǔ hé Luómǎníyàyǔ.","Ik spreek Frans en Roemeens."],
 ["parler","Je ne comprends pas.","Nu înțeleg.","I don't understand.","Não entendo.","Não percebo.","Non capisco.","No entiendo.","No entiendo.","No entiendo.","Δεν καταλαβαίνω.","Ich verstehe nicht.","Я не понимаю.","わかりません。","Wakarimasen.","我不明白。","Wǒ bù míngbai.","Ik begrijp het niet."],
 ["parler","Pouvez-vous répéter ?","Puteți repeta?","Could you repeat that?","Pode repetir?","Pode repetir?","Può ripetere?","¿Puede repetir?","¿Puede repetir?","¿Puede repetir?","Μπορείτε να το επαναλάβετε;","Können Sie das wiederholen?","Повторите, пожалуйста.","もう一度お願いします。","Mō ichido onegaishimasu.","请再说一遍。","Qǐng zài shuō yí biàn.","Kunt u dat herhalen?"],
 ["parler","Parlez plus lentement, s'il vous plaît.","Vorbiți mai rar, vă rog.","Please speak more slowly.","Fale mais devagar, por favor.","Fale mais devagar, por favor.","Parli più lentamente, per favore.","Hable más despacio, por favor.","Hable más despacio, por favor.","Hable más despacio, por favor.","Μιλήστε πιο αργά, παρακαλώ.","Sprechen Sie bitte langsamer.","Говорите медленнее, пожалуйста.","ゆっくり話してください。","Yukkuri hanashite kudasai.","请说慢一点。","Qǐng shuō màn yìdiǎn.","Spreek alstublieft langzamer."],
 ["parler","Que voulez-vous dire ?","Ce vreți să spuneți?","What do you mean?","O que você quer dizer?","O que quer dizer?","Cosa intende?","¿Qué quiere decir?","¿Qué quiere decir?","¿Qué quiere decir?","Τι εννοείτε;","Was meinen Sie?","Что вы имеете в виду?","どういう意味ですか？","Dō iu imi desu ka?","你是什么意思？","Nǐ shì shénme yìsi?","Wat bedoelt u?"],
 ["parler","Pouvez-vous l'écrire ?","Puteți să-l scrieți?","Could you write it down?","Pode escrever?","Pode escrever?","Può scriverlo?","¿Me lo puede escribir?","¿Me lo puede escribir?","¿Me lo puede escribir?","Μπορείτε να το γράψετε;","Können Sie es aufschreiben?","Можете это написать?","書いていただけますか？","Kaite itadakemasu ka?","你能写下来吗？","Nǐ néng xiě xiàlái ma?","Kunt u het opschrijven?"],

 ["quest","Où sont les toilettes ?","Unde este toaleta?","Where is the toilet?","Onde fica o banheiro?","Onde é a casa de banho?","Dov'è il bagno?","¿Dónde está el baño?","¿Dónde está el baño?","¿Dónde está el baño?","Πού είναι η τουαλέτα;","Wo ist die Toilette?","Где туалет?","トイレはどこですか？","Toire wa doko desu ka?","洗手间在哪里？","Xǐshǒujiān zài nǎlǐ?","Waar is het toilet?"],
 ["quest","Combien ça coûte ?","Cât costă?","How much is it?","Quanto custa?","Quanto custa?","Quanto costa?","¿Cuánto cuesta?","¿Cuánto cuesta?","¿Cuánto cuesta?","Πόσο κοστίζει;","Wie viel kostet das?","Сколько это стоит?","いくらですか？","Ikura desu ka?","多少钱？","Duōshao qián?","Hoeveel kost het?"],
 ["quest","Quelle heure est-il ?","Cât e ceasul?","What time is it?","Que horas são?","Que horas são?","Che ore sono?","¿Qué hora es?","¿Qué hora es?","¿Qué hora es?","Τι ώρα είναι;","Wie spät ist es?","Который час?","今何時ですか？","Ima nanji desu ka?","现在几点？","Xiànzài jǐ diǎn?","Hoe laat is het?"],
 ["quest","Pouvez-vous m'aider ?","Mă puteți ajuta?","Can you help me?","Pode me ajudar?","Pode ajudar-me?","Può aiutarmi?","¿Me puede ayudar?","¿Me puede ayudar?","¿Me puede ayudar?","Μπορείτε να με βοηθήσετε;","Können Sie mir helfen?","Вы можете мне помочь?","手伝っていただけますか？","Tetsudatte itadakemasu ka?","你能帮我吗？","Nǐ néng bāng wǒ ma?","Kunt u mij helpen?"],
 ["quest","Où est la gare ?","Unde este gara?","Where is the train station?","Onde fica a estação?","Onde é a estação?","Dov'è la stazione?","¿Dónde está la estación?","¿Dónde está la estación?","¿Dónde está la estación?","Πού είναι ο σταθμός;","Wo ist der Bahnhof?","Где вокзал?","駅はどこですか？","Eki wa doko desu ka?","火车站在哪里？","Huǒchēzhàn zài nǎlǐ?","Waar is het station?"],
 ["quest","Comment vous appelez-vous ?","Cum vă numiți?","What is your name?","Qual é o seu nome?","Como se chama?","Come si chiama?","¿Cómo se llama?","¿Cómo se llama?","¿Cómo se llama?","Πώς σας λένε;","Wie heißen Sie?","Как вас зовут?","お名前は何ですか？","O-namae wa nan desu ka?","您叫什么名字？","Nín jiào shénme míngzi?","Hoe heet u?"],

 ["travail","Je commence à 8 heures.","Încep la ora 8.","I start at 8 o'clock.","Começo às 8 horas.","Começo às 8 horas.","Comincio alle 8.","Empiezo a las 8.","Empiezo a las 8.","Empiezo a las 8.","Ξεκινάω στις 8.","Ich fange um 8 Uhr an.","Я начинаю в 8 часов.","8時に始めます。","Hachi-ji ni hajimemasu.","我8点开始。","Wǒ bā diǎn kāishǐ.","Ik begin om 8 uur."],
 ["travail","Le travail est terminé.","Lucrul s-a terminat.","The work is finished.","O trabalho está terminado.","O trabalho está terminado.","Il lavoro è finito.","El trabajo está terminado.","El trabajo está terminado.","El trabajo está terminado.","Η δουλειά τελείωσε.","Die Arbeit ist fertig.","Работа закончена.","仕事が終わりました。","Shigoto ga owarimashita.","工作完成了。","Gōngzuò wánchéng le.","Het werk is klaar."],
 ["travail","J'ai besoin de plus de temps.","Am nevoie de mai mult timp.","I need more time.","Preciso de mais tempo.","Preciso de mais tempo.","Ho bisogno di più tempo.","Necesito más tiempo.","Necesito más tiempo.","Necesito más tiempo.","Χρειάζομαι περισσότερο χρόνο.","Ich brauche mehr Zeit.","Мне нужно больше времени.","もう少し時間が必要です。","Mō sukoshi jikan ga hitsuyō desu.","我需要更多时间。","Wǒ xūyào gèng duō shíjiān.","Ik heb meer tijd nodig."],
 ["travail","Où dois-je mettre ceci ?","Unde trebuie să pun asta?","Where should I put this?","Onde devo colocar isto?","Onde devo pôr isto?","Dove devo mettere questo?","¿Dónde pongo esto?","¿Dónde pongo esto?","¿Dónde pongo esto?","Πού να το βάλω αυτό;","Wohin soll ich das legen?","Куда это положить?","これはどこに置けばいいですか？","Kore wa doko ni okeba ii desu ka?","这个放在哪里？","Zhège fàng zài nǎlǐ?","Waar moet ik dit neerleggen?"],
 ["travail","C'est prêt.","Este gata.","It's ready.","Está pronto.","Está pronto.","È pronto.","Está listo.","Está listo.","Está listo.","Είναι έτοιμο.","Es ist fertig.","Готово.","準備ができました。","Junbi ga dekimashita.","准备好了。","Zhǔnbèi hǎo le.","Het is klaar."],
 ["travail","Je reviens tout de suite.","Mă întorc imediat.","I'll be right back.","Volto já.","Volto já.","Torno subito.","Vuelvo enseguida.","Ahorita vuelvo.","Ya vuelvo.","Επιστρέφω αμέσως.","Ich bin gleich zurück.","Я сейчас вернусь.","すぐ戻ります。","Sugu modorimasu.","我马上回来。","Wǒ mǎshàng huílái.","Ik ben zo terug."],
 ["travail","La réunion est à quelle heure ?","La ce oră este ședința?","What time is the meeting?","A que horas é a reunião?","A que horas é a reunião?","A che ora è la riunione?","¿A qué hora es la reunión?","¿A qué hora es la reunión?","¿A qué hora es la reunión?","Τι ώρα είναι η συνάντηση;","Um wie viel Uhr ist die Besprechung?","Во сколько собрание?","会議は何時ですか？","Kaigi wa nanji desu ka?","会议几点开始？","Huìyì jǐ diǎn kāishǐ?","Hoe laat is de vergadering?"],

 ["quotid","Un café, s'il vous plaît.","O cafea, vă rog.","A coffee, please.","Um café, por favor.","Um café, por favor.","Un caffè, per favore.","Un café, por favor.","Un café, por favor.","Un café, por favor.","Έναν καφέ, παρακαλώ.","Einen Kaffee, bitte.","Кофе, пожалуйста.","コーヒーをお願いします。","Kōhī o onegaishimasu.","请给我一杯咖啡。","Qǐng gěi wǒ yì bēi kāfēi.","Een koffie, alstublieft."],
 ["quotid","De l'eau, s'il vous plaît.","Apă, vă rog.","Water, please.","Água, por favor.","Água, por favor.","Acqua, per favore.","Agua, por favor.","Agua, por favor.","Agua, por favor.","Νερό, παρακαλώ.","Wasser, bitte.","Воды, пожалуйста.","お水をお願いします。","O-mizu o onegaishimasu.","请给我水。","Qǐng gěi wǒ shuǐ.","Water, alstublieft."],
 ["quotid","L'addition, s'il vous plaît.","Nota, vă rog.","The bill, please.","A conta, por favor.","A conta, por favor.","Il conto, per favore.","La cuenta, por favor.","La cuenta, por favor.","La cuenta, por favor.","Τον λογαριασμό, παρακαλώ.","Die Rechnung, bitte.","Счёт, пожалуйста.","お会計をお願いします。","O-kaikei o onegaishimasu.","请结账。","Qǐng jiézhàng.","De rekening, alstublieft."],
 ["quotid","J'ai faim.","Mi-e foame.","I'm hungry.","Estou com fome.","Tenho fome.","Ho fame.","Tengo hambre.","Tengo hambre.","Tengo hambre.","Πεινάω.","Ich habe Hunger.","Я хочу есть.","お腹が空きました。","Onaka ga sukimashita.","我饿了。","Wǒ è le.","Ik heb honger."],
 ["quotid","Je cherche un taxi.","Caut un taxi.","I'm looking for a taxi.","Estou procurando um táxi.","Estou à procura de um táxi.","Cerco un taxi.","Busco un taxi.","Busco un taxi.","Busco un taxi.","Ψάχνω ταξί.","Ich suche ein Taxi.","Я ищу такси.","タクシーを探しています。","Takushī o sagashite imasu.","我在找出租车。","Wǒ zài zhǎo chūzūchē.","Ik zoek een taxi."],
 ["quotid","C'est trop cher.","Este prea scump.","It's too expensive.","É muito caro.","É demasiado caro.","È troppo caro.","Es demasiado caro.","Está muy caro.","Es muy caro.","Είναι πολύ ακριβό.","Das ist zu teuer.","Это слишком дорого.","高すぎます。","Takasugimasu.","太贵了。","Tài guì le.","Het is te duur."],

 ["urgence","Appelez un médecin !","Chemați un medic!","Call a doctor!","Chame um médico!","Chame um médico!","Chiami un medico!","¡Llame a un médico!","¡Llame a un médico!","¡Llame a un médico!","Καλέστε έναν γιατρό!","Rufen Sie einen Arzt!","Вызовите врача!","医者を呼んでください！","Isha o yonde kudasai!","请叫医生！","Qǐng jiào yīshēng!","Bel een dokter!"],
 ["urgence","J'ai besoin d'aide.","Am nevoie de ajutor.","I need help.","Preciso de ajuda.","Preciso de ajuda.","Ho bisogno di aiuto.","Necesito ayuda.","Necesito ayuda.","Necesito ayuda.","Χρειάζομαι βοήθεια.","Ich brauche Hilfe.","Мне нужна помощь.","助けてください。","Tasukete kudasai.","我需要帮助。","Wǒ xūyào bāngzhù.","Ik heb hulp nodig."],
 ["urgence","Je ne me sens pas bien.","Nu mă simt bine.","I don't feel well.","Não estou me sentindo bem.","Não me sinto bem.","Non mi sento bene.","No me siento bien.","No me siento bien.","No me siento bien.","Δεν νιώθω καλά.","Mir geht es nicht gut.","Мне плохо.","気分が悪いです。","Kibun ga warui desu.","我不舒服。","Wǒ bù shūfu.","Ik voel me niet goed."],
 ["urgence","Où est l'hôpital ?","Unde este spitalul?","Where is the hospital?","Onde fica o hospital?","Onde é o hospital?","Dov'è l'ospedale?","¿Dónde está el hospital?","¿Dónde está el hospital?","¿Dónde está el hospital?","Πού είναι το νοσοκομείο;","Wo ist das Krankenhaus?","Где больница?","病院はどこですか？","Byōin wa doko desu ka?","医院在哪里？","Yīyuàn zài nǎlǐ?","Waar is het ziekenhuis?"],
 ["urgence","Attention !","Atenție!","Watch out!","Cuidado!","Cuidado!","Attenzione!","¡Cuidado!","¡Cuidado!","¡Cuidado!","Προσοχή!","Vorsicht!","Осторожно!","気をつけて！","Ki o tsukete!","小心！","Xiǎoxīn!","Pas op!"]
];

/* Nombres et jours : mêmes colonnes, construits à partir de listes. */
(function () {
  function add(theme, lists) {
    for (var i = 0; i < lists.fr.length; i++) {
      BIBI_ROWS.push([theme, lists.fr[i], lists.ro[i], lists.en[i], lists.pt[i], lists.pt[i], lists.it[i], lists.es[i], lists.es[i], lists.es[i],
        lists.el[i], lists.de[i], lists.ru[i], lists.ja[i], lists.jaT[i], lists.zh[i], lists.zhT[i], lists.nl[i]]);
    }
  }
  add("nombres", {
    fr: ["un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix"],
    ro: ["unu","doi","trei","patru","cinci","șase","șapte","opt","nouă","zece"],
    en: ["one","two","three","four","five","six","seven","eight","nine","ten"],
    pt: ["um","dois","três","quatro","cinco","seis","sete","oito","nove","dez"],
    it: ["uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci"],
    es: ["uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez"],
    el: ["ένα","δύο","τρία","τέσσερα","πέντε","έξι","επτά","οκτώ","εννέα","δέκα"],
    de: ["eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn"],
    ru: ["один","два","три","четыре","пять","шесть","семь","восемь","девять","десять"],
    ja: ["一","二","三","四","五","六","七","八","九","十"],
    jaT: ["ichi","ni","san","yon","go","roku","nana","hachi","kyū","jū"],
    zh: ["一","二","三","四","五","六","七","八","九","十"],
    zhT: ["yī","èr","sān","sì","wǔ","liù","qī","bā","jiǔ","shí"],
    nl: ["een","twee","drie","vier","vijf","zes","zeven","acht","negen","tien"]
  });
  add("jours", {
    fr: ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"],
    ro: ["luni","marți","miercuri","joi","vineri","sâmbătă","duminică"],
    en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    pt: ["segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado","domingo"],
    it: ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"],
    es: ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"],
    el: ["Δευτέρα","Τρίτη","Τετάρτη","Πέμπτη","Παρασκευή","Σάββατο","Κυριακή"],
    de: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
    ru: ["понедельник","вторник","среда","четверг","пятница","суббота","воскресенье"],
    ja: ["月曜日","火曜日","水曜日","木曜日","金曜日","土曜日","日曜日"],
    jaT: ["getsuyōbi","kayōbi","suiyōbi","mokuyōbi","kin'yōbi","doyōbi","nichiyōbi"],
    zh: ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"],
    zhT: ["xīngqīyī","xīngqī'èr","xīngqīsān","xīngqīsì","xīngqīwǔ","xīngqīliù","xīngqīrì"],
    nl: ["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"]
  });
})();

var BIBI_VOCAB = BIBI_ROWS.map(function (row, i) {
  var v = { id: i, theme: row[0] };
  BIBI_COLS.forEach(function (k, j) { v[k] = row[j + 1]; });
  return v;
});
