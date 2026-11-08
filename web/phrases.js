/* Bibilingo – guide de phrases hors ligne. Traductions rédigées pour l'usage professionnel (intendance). */
"use strict";
var BIBI_LANGS = [
  { id: "en",   label: "Anglais (britannique)",  tts: "en-GB", mt: "en" },
  { id: "ptBR", label: "Portugais (Brésil)",      tts: "pt-BR", mt: "pt" },
  { id: "ptPT", label: "Portugais (Portugal)",    tts: "pt-PT", mt: "pt" },
  { id: "it",   label: "Italien (Italie)",        tts: "it-IT", mt: "it" },
  { id: "fr",   label: "Français (France)",       tts: "fr-FR", mt: "fr" },
  { id: "esES", label: "Espagnol (Espagne)",      tts: "es-ES", mt: "es" },
  { id: "esMX", label: "Espagnol (Mexique)",      tts: "es-MX", mt: "es" },
  { id: "esAR", label: "Espagnol (Argentine)",    tts: "es-AR", mt: "es" },
  { id: "el",   label: "Grec",                    tts: "el-GR", mt: "el" },
  { id: "de",   label: "Allemand",                tts: "de-DE", mt: "de" },
  { id: "ru",   label: "Russe",                   tts: "ru-RU", mt: "ru" },
  { id: "ja",   label: "Japonais",                tts: "ja-JP", mt: "ja" },
  { id: "zh",   label: "Chinois (mandarin)",      tts: "zh-CN", mt: "zh" },
  { id: "nl",   label: "Néerlandais",             tts: "nl-NL", mt: "nl" },
  { id: "ro",   label: "Roumain",                 tts: "ro-RO", mt: "ro" }
];

var BIBI_CATS = [
  { id: "polit", label: "👋 Politesse" },
  { id: "linge", label: "🧺 Lingerie" },
  { id: "unif",  label: "👔 Uniformes" },
  { id: "menage",label: "🧹 Ménage" },
  { id: "aide",  label: "🆘 Questions et aide" }
];

/* Ordre des champs : fr, ro, en, ptBR, ptPT, it, esES, esMX, esAR, el, de, ru, ja, zh, nl */
var BIBI_KEYS = ["fr","ro","en","ptBR","ptPT","it","esES","esMX","esAR","el","de","ru","ja","zh","nl"];
var BIBI_RAW = [
 ["polit","Bonjour.","Bună ziua.","Hello.","Olá, bom dia.","Olá, bom dia.","Buongiorno.","Buenos días.","Buenos días.","Buen día.","Καλημέρα.","Guten Tag.","Здравствуйте.","こんにちは。","您好。","Goedendag."],
 ["polit","Merci beaucoup.","Mulțumesc frumos.","Thank you very much.","Muito obrigado.","Muito obrigado.","Grazie mille.","Muchas gracias.","Muchas gracias.","Muchas gracias.","Ευχαριστώ πολύ.","Vielen Dank.","Большое спасибо.","どうもありがとうございます。","非常感谢。","Hartelijk dank."],
 ["polit","Excusez-moi.","Scuzați-mă.","Excuse me.","Com licença.","Com licença.","Mi scusi.","Disculpe.","Disculpe.","Disculpe.","Με συγχωρείτε.","Entschuldigung.","Извините.","すみません。","打扰一下。","Pardon."],
 ["polit","Je ne parle pas bien votre langue.","Nu vorbesc bine limba dumneavoastră.","I don't speak your language well.","Não falo bem a sua língua.","Não falo bem a sua língua.","Non parlo bene la sua lingua.","No hablo bien su idioma.","No hablo bien su idioma.","No hablo bien su idioma.","Δεν μιλάω καλά τη γλώσσα σας.","Ich spreche Ihre Sprache nicht gut.","Я плохо говорю на вашем языке.","あなたの言葉はあまり話せません。","我不太会说您的语言。","Ik spreek uw taal niet goed."],
 ["polit","Pouvez-vous parler plus lentement, s'il vous plaît ?","Puteți vorbi mai rar, vă rog?","Could you speak more slowly, please?","Pode falar mais devagar, por favor?","Pode falar mais devagar, por favor?","Può parlare più lentamente, per favore?","¿Puede hablar más despacio, por favor?","¿Puede hablar más despacio, por favor?","¿Puede hablar más despacio, por favor?","Μπορείτε να μιλάτε πιο αργά, παρακαλώ;","Können Sie bitte langsamer sprechen?","Говорите, пожалуйста, медленнее.","もう少しゆっくり話していただけますか。","请您说慢一点，好吗？","Kunt u alstublieft langzamer praten?"],
 ["polit","Bonne journée !","O zi bună!","Have a nice day!","Tenha um bom dia!","Tenha um bom dia!","Buona giornata!","¡Que tenga un buen día!","¡Que tenga un buen día!","¡Que tenga un buen día!","Καλή σας μέρα!","Einen schönen Tag noch!","Хорошего дня!","よい一日を！","祝您今天愉快！","Fijne dag nog!"],

 ["linge","Où dois-je mettre le linge propre ?","Unde trebuie să pun rufele curate?","Where should I put the clean laundry?","Onde devo colocar a roupa limpa?","Onde devo pôr a roupa lavada?","Dove devo mettere la biancheria pulita?","¿Dónde pongo la ropa limpia?","¿Dónde pongo la ropa limpia?","¿Dónde pongo la ropa limpia?","Πού να βάλω τα καθαρά ρούχα;","Wohin soll ich die saubere Wäsche legen?","Куда положить чистое бельё?","きれいな洗濯物はどこに置けばいいですか。","干净的衣物放在哪里？","Waar moet ik de schone was neerleggen?"],
 ["linge","Les draps sont prêts.","Cearșafurile sunt gata.","The sheets are ready.","Os lençóis estão prontos.","Os lençóis estão prontos.","Le lenzuola sono pronte.","Las sábanas están listas.","Las sábanas están listas.","Las sábanas están listas.","Τα σεντόνια είναι έτοιμα.","Die Bettlaken sind fertig.","Простыни готовы.","シーツの準備ができました。","床单准备好了。","De lakens zijn klaar."],
 ["linge","Je vais changer les serviettes.","Voi schimba prosoapele.","I am going to change the towels.","Vou trocar as toalhas.","Vou trocar as toalhas.","Cambio gli asciugamani.","Voy a cambiar las toallas.","Voy a cambiar las toallas.","Voy a cambiar las toallas.","Θα αλλάξω τις πετσέτες.","Ich wechsle die Handtücher.","Я поменяю полотенца.","タオルを交換します。","我去换毛巾。","Ik ga de handdoeken verwisselen."],
 ["linge","Ce vêtement doit être lavé à la main.","Această haină trebuie spălată de mână.","This garment must be washed by hand.","Esta peça deve ser lavada à mão.","Esta peça deve ser lavada à mão.","Questo capo va lavato a mano.","Esta prenda se debe lavar a mano.","Esta prenda se debe lavar a mano.","Esta prenda se debe lavar a mano.","Αυτό το ρούχο πρέπει να πλυθεί στο χέρι.","Dieses Kleidungsstück muss von Hand gewaschen werden.","Эту вещь нужно стирать вручную.","この衣類は手洗いが必要です。","这件衣服需要手洗。","Dit kledingstuk moet met de hand gewassen worden."],
 ["linge","À quelle température dois-je laver ?","La ce temperatură trebuie să spăl?","At what temperature should I wash it?","Em que temperatura devo lavar?","A que temperatura devo lavar?","A che temperatura devo lavare?","¿A qué temperatura lo lavo?","¿A qué temperatura lo lavo?","¿A qué temperatura lo lavo?","Σε ποια θερμοκρασία να το πλύνω;","Bei welcher Temperatur soll ich waschen?","При какой температуре стирать?","何度で洗えばいいですか。","应该用多少度水洗？","Op welke temperatuur moet ik wassen?"],
 ["linge","Il y a une tache.","Este o pată.","There is a stain.","Tem uma mancha.","Há uma nódoa.","C'è una macchia.","Hay una mancha.","Hay una mancha.","Hay una mancha.","Υπάρχει ένας λεκές.","Da ist ein Fleck.","Здесь пятно.","シミがあります。","这里有污渍。","Er zit een vlek op."],
 ["linge","Le repassage est terminé.","Călcatul este gata.","The ironing is done.","Já passei a roupa.","A roupa já está passada.","Ho finito di stirare.","Ya está planchado.","Ya terminé de planchar.","Ya terminé de planchar.","Το σιδέρωμα τελείωσε.","Das Bügeln ist fertig.","Глажка закончена.","アイロンがけが終わりました。","衣服熨好了。","Het strijken is klaar."],

 ["unif","Quelle est votre taille ?","Ce mărime purtați?","What size are you?","Qual é o seu tamanho?","Qual é o seu tamanho?","Che taglia porta?","¿Qué talla usa?","¿Qué talla usa?","¿Qué talle usa?","Τι νούμερο φοράτε;","Welche Größe haben Sie?","Какой у вас размер?","サイズはいくつですか。","您穿什么尺码？","Welke maat heeft u?"],
 ["unif","Voici votre uniforme.","Iată uniforma dumneavoastră.","Here is your uniform.","Aqui está o seu uniforme.","Aqui está a sua farda.","Ecco la sua divisa.","Aquí tiene su uniforme.","Aquí tiene su uniforme.","Aquí tiene su uniforme.","Ορίστε η στολή σας.","Hier ist Ihre Uniform.","Вот ваша форма.","こちらがあなたの制服です。","这是您的制服。","Hier is uw uniform."],
 ["unif","Pouvez-vous l'essayer, s'il vous plaît ?","Îl puteți proba, vă rog?","Could you try it on, please?","Pode experimentar, por favor?","Pode experimentar, por favor?","Può provarla, per favore?","¿Se lo puede probar, por favor?","¿Se lo puede probar, por favor?","¿Se lo puede probar, por favor?","Μπορείτε να τη δοκιμάσετε, παρακαλώ;","Können Sie es bitte anprobieren?","Примерьте, пожалуйста.","試着していただけますか。","请您试穿一下好吗？","Kunt u het even passen, alstublieft?"],
 ["unif","Il manque un bouton.","Lipsește un nasture.","A button is missing.","Está faltando um botão.","Falta um botão.","Manca un bottone.","Falta un botón.","Falta un botón.","Falta un botón.","Λείπει ένα κουμπί.","Es fehlt ein Knopf.","Не хватает пуговицы.","ボタンが一つ取れています。","少了一颗扣子。","Er ontbreekt een knoop."],
 ["unif","Je vais faire une retouche.","Voi face o ajustare.","I will alter it.","Vou fazer um ajuste.","Vou fazer um arranjo.","Farò una piccola modifica.","Voy a hacer un arreglo.","Voy a hacer un arreglo.","Voy a hacer un arreglo.","Θα κάνω μια μετατροπή.","Ich werde es ändern.","Я подгоню по размеру.","お直しをします。","我来改一下。","Ik ga het vermaken."],

 ["menage","Puis-je faire le ménage maintenant ?","Pot să fac curățenie acum?","May I clean now?","Posso fazer a limpeza agora?","Posso fazer a limpeza agora?","Posso pulire adesso?","¿Puedo limpiar ahora?","¿Puedo limpiar ahora?","¿Puedo limpiar ahora?","Μπορώ να καθαρίσω τώρα;","Darf ich jetzt sauber machen?","Можно сейчас убрать?","今、掃除してもいいですか。","我现在可以打扫吗？","Mag ik nu schoonmaken?"],
 ["menage","Je reviendrai plus tard.","Revin mai târziu.","I will come back later.","Volto mais tarde.","Volto mais tarde.","Torno più tardi.","Volveré más tarde.","Volveré más tarde.","Vuelvo más tarde.","Θα επιστρέψω αργότερα.","Ich komme später wieder.","Я зайду позже.","後でまた来ます。","我稍后再来。","Ik kom later terug."],
 ["menage","Attention, le sol est mouillé.","Atenție, podeaua este udă.","Careful, the floor is wet.","Cuidado, o chão está molhado.","Cuidado, o chão está molhado.","Attenzione, il pavimento è bagnato.","Cuidado, el suelo está mojado.","Cuidado, el piso está mojado.","Cuidado, el piso está mojado.","Προσοχή, το πάτωμα είναι βρεγμένο.","Vorsicht, der Boden ist nass.","Осторожно, мокрый пол.","床が濡れているので気をつけてください。","小心，地板是湿的。","Pas op, de vloer is nat."],
 ["menage","La chambre est prête.","Camera este gata.","The room is ready.","O quarto está pronto.","O quarto está pronto.","La camera è pronta.","La habitación está lista.","El cuarto está listo.","La habitación está lista.","Το δωμάτιο είναι έτοιμο.","Das Zimmer ist fertig.","Комната готова.","お部屋の準備ができました。","房间准备好了。","De kamer is klaar."],
 ["menage","Où sont les produits d'entretien ?","Unde sunt produsele de curățenie?","Where are the cleaning products?","Onde estão os produtos de limpeza?","Onde estão os produtos de limpeza?","Dove sono i prodotti per la pulizia?","¿Dónde están los productos de limpieza?","¿Dónde están los productos de limpieza?","¿Dónde están los productos de limpieza?","Πού είναι τα καθαριστικά;","Wo sind die Reinigungsmittel?","Где моющие средства?","掃除用品はどこにありますか。","清洁用品在哪里？","Waar zijn de schoonmaakmiddelen?"],
 ["menage","Je dois passer l'aspirateur.","Trebuie să dau cu aspiratorul.","I need to vacuum.","Preciso passar o aspirador.","Tenho de aspirar.","Devo passare l'aspirapolvere.","Tengo que pasar la aspiradora.","Tengo que pasar la aspiradora.","Tengo que pasar la aspiradora.","Πρέπει να σκουπίσω με την ηλεκτρική σκούπα.","Ich muss staubsaugen.","Мне нужно пропылесосить.","掃除機をかけなければなりません。","我需要吸尘。","Ik moet stofzuigen."],
 ["menage","Faut-il ouvrir les fenêtres ?","Trebuie să deschid ferestrele?","Should I open the windows?","Devo abrir as janelas?","Devo abrir as janelas?","Devo aprire le finestre?","¿Abro las ventanas?","¿Abro las ventanas?","¿Abro las ventanas?","Να ανοίξω τα παράθυρα;","Soll ich die Fenster öffnen?","Открыть окна?","窓を開けましょうか。","要开窗吗？","Zal ik de ramen openzetten?"],

 ["aide","Pouvez-vous répéter, s'il vous plaît ?","Puteți repeta, vă rog?","Could you repeat that, please?","Pode repetir, por favor?","Pode repetir, por favor?","Può ripetere, per favore?","¿Puede repetir, por favor?","¿Puede repetir, por favor?","¿Puede repetir, por favor?","Μπορείτε να το επαναλάβετε, παρακαλώ;","Können Sie das bitte wiederholen?","Повторите, пожалуйста.","もう一度言っていただけますか。","请您再说一遍好吗？","Kunt u dat herhalen, alstublieft?"],
 ["aide","Je ne comprends pas.","Nu înțeleg.","I don't understand.","Não entendo.","Não percebo.","Non capisco.","No entiendo.","No entiendo.","No entiendo.","Δεν καταλαβαίνω.","Ich verstehe nicht.","Я не понимаю.","わかりません。","我不明白。","Ik begrijp het niet."],
 ["aide","Pouvez-vous l'écrire ?","Puteți să-l scrieți?","Could you write it down?","Pode escrever, por favor?","Pode escrever, por favor?","Può scriverlo?","¿Me lo puede escribir?","¿Me lo puede escribir?","¿Me lo puede escribir?","Μπορείτε να το γράψετε;","Können Sie es aufschreiben?","Можете написать?","書いていただけますか。","您能写下来吗？","Kunt u het opschrijven?"],
 ["aide","J'ai besoin d'aide.","Am nevoie de ajutor.","I need help.","Preciso de ajuda.","Preciso de ajuda.","Ho bisogno di aiuto.","Necesito ayuda.","Necesito ayuda.","Necesito ayuda.","Χρειάζομαι βοήθεια.","Ich brauche Hilfe.","Мне нужна помощь.","助けが必要です。","我需要帮助。","Ik heb hulp nodig."],
 ["aide","À quelle heure dois-je venir ?","La ce oră trebuie să vin?","What time should I come?","A que horas devo vir?","A que horas devo vir?","A che ora devo venire?","¿A qué hora tengo que venir?","¿A qué hora tengo que venir?","¿A qué hora tengo que venir?","Τι ώρα πρέπει να έρθω;","Um wie viel Uhr soll ich kommen?","Во сколько мне прийти?","何時に来ればいいですか。","我应该几点来？","Hoe laat moet ik komen?"]
];

var BIBI_PHRASES = BIBI_RAW.map(function (row, i) {
  var p = { id: i, cat: row[0] };
  BIBI_KEYS.forEach(function (k, j) { p[k] = row[j + 1]; });
  return p;
});
