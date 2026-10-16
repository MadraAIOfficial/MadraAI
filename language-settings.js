/* Publiczna lokalizacja interfejsu i tłumaczenie w trybie angielskim. */
(() => {
  'use strict';

  const english = Object.freeze({
    'Strona główna':'Home', 'Czat':'Chat', 'Ogłoszenia':'Announcements', 'Ustawienia':'Settings',
    'Dostosuj wygląd MądraAI.':'Customize the appearance of MądraAI.',
    'Motyw':'Theme', 'Wybierz wygląd strony. Twój wybór zostanie zapamiętany w tej przeglądarce.':'Choose the appearance of the site. Your choice will be saved in this browser.',
    'Aktualny motyw':'Current theme', 'Ciemny':'Dark', 'Jasny':'Light', 'Zmień motyw':'Change theme',
    'Rozmiar czatu':'Chat size', 'Wybierz wielkość wiadomości. Ustawienie zapisze się w tej przeglądarce.':'Choose the message size. This setting will be saved in this browser.',
    'Oddalony':'Compact', 'Średni':'Medium', 'Przybliżony':'Large',
    'Czcionka':'Font', 'Rubik Medium jest domyślna. Możesz przywrócić poprzedni krój pisma.':'Rubik Medium is the default. You can restore the previous font.',
    'Dela Gothic One (Poprzednia)':'Dela Gothic One (Previous)', 'Język':'Language', 'Język strony':'Site language',
    'Polski':'Polish', '16 października 2026':'October 16, 2026', '15 października 2026':'October 15, 2026', '14 października 2026':'October 14, 2026', 'Wybierz język interfejsu i odpowiedzi modelu.':'Choose the language for the interface and model replies.',
    'Język ustawiasz ręcznie; aplikacja nie wykrywa go na podstawie wiadomości.':'Choose the language manually; the app does not detect it from your messages.',
    'Tryb angielski tłumaczy pytanie na polski dla modelu, a odpowiedź z powrotem na angielski.':'English mode translates your question into Polish for the model, then translates the answer back into English.', 'Tłumaczenie pytań i odpowiedzi odbywa się przez zewnętrzną usługę MyMemory.':'Questions and answers are translated using the external MyMemory service.',
    'Angielskie ogłoszenia są tłumaczone automatycznie z języka polskiego.':'English announcements are translated automatically from Polish.',
    'MądraAI - Prosta sztuczna inteligencja oparta na dużej ilości tekstów, pytań i odpowiedzi, która jest cały czas trenowana. Stworzona przez Fabexa z drobną pomocą Jedynusa.':'MądraAI is a simple artificial intelligence based on a large collection of texts, questions, and answers, and is continuously being trained. Created by Fabex with a little help from Jedynus.', 'O MądraAI':'About MądraAI', 'Zamknij':'Close', 'Wybierz motyw':'Choose a theme', 'Na razie brak modeli w tej kategorii.':'No models in this category yet.', 'Model MądraAI':'MądraAI model', 'Sterling':'Sterling', 'Orzech':'Orzech', 'Rubik Medium':'Rubik Medium', 'Klasyczne':'Classic', 'Więcej motywów':'More themes', 'Nowy':'New',
    'Modele MądraAI':'MądraAI models', 'Wybierz model':'Choose a model', 'Brak modeli':'No models',
    'Brak dostępnych modeli':'No models available', 'Wkrótce...':'Coming soon...', '1 model':'1 model',
    '2 modele':'2 models', '3 modele':'3 models', '4 modele':'4 models', '5 modeli':'5 models',
    '6 modeli':'6 models', '7 modeli':'7 models', '8 modeli':'8 models', '9 modeli':'9 models',
    'Rozpocznij rozmowę':'Start a conversation', 'Wybierz model i napisz wiadomość.':'Choose a model and write a message.',
    'Napisz wiadomość…':'Write a message…', 'Wyślij':'Send', 'Zacznij pisać z MądraAI':'Chat with MądraAI',
    'Pytania zadane dzisiaj':'Questions asked today', 'Najnowszy model':'Latest model', 'Ładowanie…':'Loading…',
    'Oficjalni partnerzy':'Official partners', 'MądraAI jest na wczesnym etapie rozwoju i może popełniać błędy.':'MądraAI is in an early stage of development and may make mistakes.',
    'Ważne':'Important', 'Bez tytułu':'Untitled', 'Cofnij':'Back', 'Brak ogłoszeń.':'No announcements.',
    'Opcje wiadomości':'Message options', 'Kopiuj wiadomość':'Copy message', 'Skopiowano':'Copied',
    'Nie udało się skopiować':'Could not copy', 'Super odpowiedź':'Great answer', 'Zapisuję…':'Saving…',
    'Zapisano':'Saved', 'Nie udało się zapisać':'Could not save', 'Rozumiem':'Got it',
    'Analizuję pytanie i wiedzę':'Analyzing your question and the model knowledge',
    'Pokaż ostrzeżenie o odpowiedzi':'Show answer warning', 'Ostrzeżenie o odpowiedzi':'Answer warning',
    'Temat, o który pytasz, nie został jeszcze dobrze wytrenowany w tym modelu. Ta odpowiedź może być niepoprawna.':'This model has not been trained well on this topic yet. This answer may be incorrect.',
    'Model miał problem z tą wiadomością. Odpowiedź może być niepoprawna.':'The model had a problem with this message. The answer may be incorrect.',
    'Pokaż informację o użyciu narzędzia':'Show tool usage information', 'Informacja o użyciu narzędzia':'Tool usage information',
    'Przy tej wiadomości model musiał dokładniej przeanalizować treść i skorzystał ze specjalnego narzędzia, które rozszerza jego możliwości.':'For this message, the model analyzed the content more carefully and used a special tool to extend its capabilities.',
    'Nie udało się wczytać wybranego modelu.':'Could not load the selected model.',
    'Nie udało się przygotować odpowiedzi.':'Could not prepare an answer.',
    'Tłumaczenie trwa zbyt długo. Sprawdź połączenie i spróbuj ponownie.':'Translation is taking too long. Check your connection and try again.',
    'Nie udało się przetłumaczyć wiadomości. Spróbuj ponownie.':'Could not translate the message. Please try again.',
    'Tłumaczenie w toku…':'Translating…', 'Automatycznie przetłumaczono z polskiego':'Automatically translated from Polish',
    'Nie udało się przetłumaczyć ogłoszenia. Wyświetlam polski oryginał.':'Could not translate this announcement. Showing the Polish original.',
    'Tłumaczenie automatyczne z polskiego':'Automatically translated from Polish',
    'Serwer Discord będzie wkrótce dostępny':'The Discord server will be available soon', 'Pokazuję 0 do czasu pobrania aktualnej statystyki.':'Showing 0 until the latest statistics are fetched.', 'Pokazuję ostatni zapisany odczyt. Licznik odświeży się po przywróceniu połączenia.':'Showing the last saved value. The counter will refresh when the connection is restored.',
    'Discord - wkrótce':'Discord - coming soon', 'Odpowiedź powstała z dostępnych skojarzeń i kontekstu; może być mniej trafna.':'The answer was assembled from available associations and context and may be less accurate.'
  });

  let locale='pl';
  try { locale=localStorage.getItem('madraAI-language')==='en'?'en':'pl'; } catch {}
  const originalText=new WeakMap();
  const originalAttributes=new WeakMap();
  const announcementCache=new WeakMap();
  let activeAnnouncement=null;
  let inFlight=0;
  const translationWaiters=[];

  function uiText(polish){return locale==='en'?(english[polish]||polish):polish}
  function hash(value){let n=2166136261;for(const char of String(value)){n^=char.charCodeAt(0);n=Math.imul(n,16777619)}return(n>>>0).toString(36)}
  function protectModelNames(value){
    const names=[];let text=String(value||'');
    text=text.replace(/\bSterling(?:a|owi|iem|u|i|ów|om|ach)?\s*(1\.[012])\b/giu,(_,version)=>{const token=`MADRAAIMODEL${names.length}TOKEN`;names.push(`Sterling ${version}`);return token});
    text=text.replace(/\bOrzech(?:a|owi|em|u|y|ów|om|ach)?\s*2\.0\b/giu,()=>{const token=`MADRAAIMODEL${names.length}TOKEN`;names.push('Orzech 2.0');return token});
    text=text.replace(/\bSterling(?:a|owi|iem|u|i|ów|om|ach)?\b/giu,()=>{const token=`MADRAAIMODEL${names.length}TOKEN`;names.push('Sterling');return token});
    text=text.replace(/\bOrzech(?:a|owi|em|u|y|ów|om|ach)?\b/giu,()=>{const token=`MADRAAIMODEL${names.length}TOKEN`;names.push('Orzech');return token});
    return{text,names};
  }
  function restoreModelNames(value,names){let text=String(value||'');names.forEach((name,index)=>{text=text.replace(new RegExp(`MADRAAIMODEL${index}TOKEN`,'giu'),name)});return text}
  function localizeTextNode(node){
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const source=originalText.get(node),trimmed=source.trim();
    const translated=locale==='en'?(english[trimmed]||trimmed):trimmed;
    const leading=source.match(/^\s*/u)?.[0]||'',trailing=source.match(/\s*$/u)?.[0]||'';
    const next=leading+translated+trailing;
    if(node.nodeValue!==next)node.nodeValue=next;
  }
  function localizeElement(element){
    if(element.nodeType===Node.TEXT_NODE){localizeTextNode(element);return}
    if(element.nodeType!==Node.ELEMENT_NODE&&element!==document.body)return;
    const attributes=['title','aria-label','placeholder','alt'];
    if(element.nodeType===Node.ELEMENT_NODE){
      let saved=originalAttributes.get(element);if(!saved){saved=new Map();originalAttributes.set(element,saved)}
      for(const attribute of attributes){
        if(!element.hasAttribute(attribute))continue;
        if(!saved.has(attribute))saved.set(attribute,element.getAttribute(attribute));
        const source=saved.get(attribute),next=locale==='en'?(english[source]||source):source;
        if(element.getAttribute(attribute)!==next)element.setAttribute(attribute,next);
      }
    }
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))localizeTextNode(node);
  }
  function splitText(value,limit=440){
    const text=String(value||'');if(text.length<=limit)return[text];
    const fragments=text.match(/[^.!?\n]+[.!?]*(?:\s+|$)|\n+/gu)||[text]
    const chunks=[];let current='';
    for(let fragment of fragments){
      while(fragment.length>limit){let cut=fragment.lastIndexOf(' ',limit);if(cut<Math.floor(limit*.55))cut=limit;chunks.push(current+fragment.slice(0,cut));current='';fragment=fragment.slice(cut)}
      if((current+fragment).length>limit&&current){chunks.push(current);current=''}
      current+=fragment;
    }
    if(current)chunks.push(current);
    return chunks.length?chunks:[text];
  }
  async function acquireTranslationSlot(){if(inFlight<3){inFlight++;return}await new Promise(resolve=>translationWaiters.push(resolve));inFlight++}
  function releaseTranslationSlot(){inFlight=Math.max(0,inFlight-1);translationWaiters.shift()?.()}
  async function translateChunk(text,from,to){
    const protectedNames=protectModelNames(text);text=protectedNames.text;
    const key='madraAI-translation-v3:'+hash(from+'|'+to+'|'+text);
    try{const cached=localStorage.getItem(key);if(cached)return cached}catch{}
    const brandToken='MADRAAI_KEEP_BRAND_86Q';
    const safe=String(text).replace(/MądraAI/giu,brandToken);
    await acquireTranslationSlot();
    try{
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
      try{
        const url=new URL('https://api.mymemory.translated.net/get');url.searchParams.set('q',safe);url.searchParams.set('langpair',from+'|'+to);
        const response=await fetch(url.href,{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error('translate');
        const data=await response.json(),translated=data?.responseData?.translatedText;
        if(Number(data?.responseStatus)!==200||typeof translated!=='string'||!translated.trim())throw Error('translate');
        const area=document.createElement('textarea');area.innerHTML=translated;
        const result=restoreModelNames(area.value.replace(new RegExp(brandToken,'giu'),'MądraAI'),protectedNames.names);
        try{localStorage.setItem(key,result)}catch{}
        return result;
      }finally{clearTimeout(timeout)}
    }catch(error){
      if(error?.name==='AbortError')throw Error(uiText('Tłumaczenie trwa zbyt długo. Sprawdź połączenie i spróbuj ponownie.'));
      throw Error(uiText('Nie udało się przetłumaczyć wiadomości. Spróbuj ponownie.'));
    }finally{releaseTranslationSlot()}
  }
  async function translateText(value,from,to,onProgress=()=>{}){
    const protectedNames=protectModelNames(String(value||''));
    const text=protectedNames.text;if(!text.trim()||from===to)return restoreModelNames(text,protectedNames.names);
    const parts=splitText(text);let complete=0;const translated=[];
    for(const part of parts){if(/^\n+$/u.test(part)){translated.push(part);continue}translated.push(await translateChunk(part,from,to));complete++;try{onProgress(Math.round(complete/parts.length*100))}catch{}}
    return restoreModelNames(translated.join('').replace(/\s+([,.;:!?])/gu,'$1').trim(),protectedNames.names);
  }
  function translateDate(value){
    const text=String(value||'');
    const match=text.match(/^(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{4})$/iu);
    if(!match)return translateText(text,'pl','en');
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const polishMonths=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    const index=polishMonths.indexOf(match[2].toLocaleLowerCase('pl'));
    return Promise.resolve(index>=0?`${months[index]} ${Number(match[1])}, ${match[3]}`:text);
  }
  function translateAnnouncement(post){
    if(announcementCache.has(post))return announcementCache.get(post);
    const pending=Promise.all([translateText(post.title||'Bez tytułu','pl','en'),translateText(post.text||'','pl','en'),translateDate(post.date||'')])
      .then(([title,text,date])=>({title,text,date,ok:true}))
      .catch(()=>({title:post.title||'Untitled',text:post.text||'',date:post.date||'',ok:false}));
    announcementCache.set(post,pending);return pending;
  }
  function decorateAnnouncementCard(post,card,title,date,content){
    if(locale!=='en')return;
    let note=card.querySelector('.announcementTranslationNote');
    if(!note){note=document.createElement('span');note.className='announcementTranslationNote';content.append(note)}
    const setNote=ok=>{note.textContent=ok?uiText('Automatycznie przetłumaczono z polskiego'):uiText('Nie udało się przetłumaczyć ogłoszenia. Wyświetlam polski oryginał.')};
    const cached=announcementCache.get(post);
    if(cached){cached.then(result=>{if(!card.isConnected||locale!=='en')return;title.textContent=result.title;if(date&&result.date)date.textContent=result.date;setNote(result.ok)});return}
    title.textContent=uiText('Tłumaczenie w toku…');if(date&&post.date)date.textContent=post.date;note.textContent=uiText('Tłumaczenie w toku…');
    translateAnnouncement(post).then(result=>{if(!card.isConnected||locale!=='en')return;title.textContent=result.title;if(date&&result.date)date.textContent=result.date;setNote(result.ok)});
  }
  function translateAnnouncementDetail(post,article,title,text,date){
    activeAnnouncement=post;if(locale!=='en')return;
    let note=article.querySelector('.announcementTranslationNote');
    if(!note){note=document.createElement('p');note.className='announcementTranslationNote';article.insertBefore(note,title)}
    title.textContent=uiText('Tłumaczenie w toku…');text.textContent=uiText('Tłumaczenie w toku…');note.textContent=uiText('Tłumaczenie w toku…');
    translateAnnouncement(post).then(result=>{if(activeAnnouncement!==post||locale!=='en')return;title.textContent=result.title;text.textContent=result.text;if(date&&result.date)date.textContent=result.date;note.textContent=result.ok?uiText('Automatycznie przetłumaczono z polskiego'):uiText('Nie udało się przetłumaczyć ogłoszenia. Wyświetlam polski oryginał.')});
  }
  function refreshAnnouncements(){
    const active=activeAnnouncement;
    if(typeof renderHome==='function'&&Array.isArray(announcementPosts)&&announcementPosts.length)renderHome(announcementPosts);
    if(active&&typeof openAnnouncement==='function')openAnnouncement(active,null);
  }
  function applyLanguage(next,persist=true){
    locale=next==='en'?'en':'pl';document.documentElement.lang=locale;
    const selector=document.querySelector('#languageChoice');if(selector)selector.value=locale;
    if(persist){try{localStorage.setItem('madraAI-language',locale)}catch{}}
    if(locale==='en')document.title='MądraAI';
    localizeElement(document.body);
    const notice=document.querySelector('#languageTranslationNotice');if(notice)notice.hidden=locale!=='en';
    const counter=document.querySelector('#questionsToday');if(counter){const count=Number(counter.textContent.replace(/[^0-9]/gu,''));if(Number.isSafeInteger(count))counter.textContent=new Intl.NumberFormat(locale==='en'?'en-US':'pl-PL').format(count)}
    window.dispatchEvent(new CustomEvent('madraai:languagechange',{detail:{locale}}));
    refreshAnnouncements();
  }
  function clearActiveAnnouncement(){activeAnnouncement=null}
  window.MadraAISettings={get locale(){return locale},uiText,translateText,decorateAnnouncementCard,translateAnnouncementDetail,clearActiveAnnouncement,refreshAnnouncements,applyLanguage};

  const selector=document.querySelector('#languageChoice');
  selector?.addEventListener('change',()=>applyLanguage(selector.value));
  const observer=new MutationObserver(records=>{for(const record of records){for(const node of record.addedNodes||[])localizeElement(node);if(record.type==='attributes')localizeElement(record.target)}});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt']});
  applyLanguage(locale,false);
})();
