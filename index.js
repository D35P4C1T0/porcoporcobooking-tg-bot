/*
.==-.                   .-==.
 \()8`-._  `.   .'  _.-'8()/
 (88"   ::.  \./  .::   "88)
  \_.'`-::::.(#).::::-'`._/
    `._... .q(_)p. ..._.'
      ""-..-'|=|`-..-""
      .""' .'|=|`. `"".
    ,':8(o)./|=|\.(o)8:`.
   (O :8 ::/ \_/ \:: 8: O)
    \O `::/       \::' O/
     ""--'         `--""   

    Todo:
        Porting delle funzioni di base precedenti       [v~]
        Tasti interattivi inline per comandare il bot   []
        Input del nome, da ctx.from.first_name          [v]
*/

const Telegraf = require('telegraf')
const { Markup } = require('telegraf')
const axios = require('axios')
const commandParts = require('./extras/telegraf-command-parts')
const TelegrafInlineMenu = require('telegraf-inline-menu')

// Apikeys
// const JsonBinApiKey = require('./extras/jsonBin').ApiKey
const binID = process.env.JSONBINID
const tg_TOKEN = process.env.TGBOTAPI
const crypto = require('./extras/crypto')

const menu = new TelegrafInlineMenu(
  ctx => `Hey ${ctx.from.first_name}` + welcomeMessage
)
menu.simpleButton('Prenota!', 'a', {
  doFunc: ctx => prenotazione(ctx)
})
menu.simpleButton('Controlla Posti', 'b', {
  doFunc: ctx => fetchLatest(ctx)
})

menu.setCommand('start')

// bot
const bot = new Telegraf(tg_TOKEN)
bot.use(commandParts())
bot.use(menu.init())

let welcomeMessage =
  ', questo bot ti permette di prenotare un posto nella mia macchina, ed è ancora in fase sperimentale.\n➡ Premi il tasto Controlla per controllare i posti disponibili \n➡ Premi il tasto Prenota per richiedere una prenotazione'

let nope = '🙅🏻‍♂️'
let yah = '🙋🏻‍♂️'
var postiMassimi = 4

// fun stuff
// bot.start(ctx => ctx.reply(`Hey ${ctx.from.first_name}` + welcomeMessage))
// bot.help(ctx => ctx.reply('Send me a sticker 🅱OI'))
// bot.on('sticker', ctx => ctx.reply('😠'))
// bot.hears('hi', ctx => ctx.reply('Hey there'))
bot.command('check', ctx => fetchLatest(ctx))
bot.command('prenota', ctx => prenotazione(ctx))
bot.command('resetposti', ctx => JSONReset(ctx))
// nei comandi che mandano messaggi mi tocca passare il middleware
// come argomento perchè sono un inetto
bot.launch()

//ctx pare essere il middleware che permette di interagire in chat

function fetchLatest(ctx) {
  axios
    .get('https://api.jsonbin.io/b/' + binID + '/latest')
    .then(response => {
      // console.log(response.data)
      let personePrenotate = []
      let postiObject = Object.values(response.data)[0]
      //console.log(postiObject)

      Object.values(postiObject).forEach(seat => {
        if (seat != '') {
          personePrenotate.push(seat)
        }
      })

      ctx.reply(createMessageText(personePrenotate))
      // bot.telegram.sendMessage(ctx.message.chat.id, `Hanno fetchato`) // mi informa
      // console.log(personePrenotate)
    })
    .catch(error => {
      console.log(error)
    })
}

function prenotazione(ctx) {
  axios
    .get('https://api.jsonbin.io/b/' + binID + '/latest')
    .then(response => {
      // console.log(response.data)
      let personePrenotate = []
      let postiObject = Object.values(response.data)[0]
      // console.log('Primo arg: ' + ctx.state.command.splitArgs[0])

      let nomeDaInserire = capitalize(ctx.from.first_name)
      // if (ctx.state.command.splitArgs[0] != undefined) {
      //   if (/[^a-zA-Z]/.test(ctx.state.command.splitArgs[0])) {
      //     ctx.reply('Inserisci un nome valido, senza punteggiatura.')
      //     return
      //   }
      //   nomeSporco = ctx.state.command.splitArgs[0].toLowerCase()
      // } else {
      //   nomeSporco = ctx.from.first_name
      // }

      Object.values(postiObject).forEach(seat => {
        if (seat != '') {
          personePrenotate.push(seat)
        }
      })

      let returnMessage = 'Stato richiesta: '
      if (!personePrenotate.includes(nomeDaInserire)) {
        if (personePrenotate.length < postiMassimi) {
          personePrenotate.push(nomeDaInserire)
        } else {
          returnMessage += 'Attualmente siamo al completo. '
        }
      } else {
        returnMessage += 'Pare che tu abbia già un posto in macchina. '
      }
      if (returnMessage === 'Stato richiesta: ') {
        returnMessage += 'Prenotazione avvenuta ' + yah
      }

      piazzaPrenotazione(personePrenotate)
      ctx.reply(returnMessage)
    })
    .catch(error => {
      console.log(error)
    })
}

const piazzaPrenotazione = listaPersone => {
  let data = {
    'troyota:': {
      posto1: listaPersone[0],
      posto2: listaPersone[1],
      posto3: listaPersone[2],
      posto4: listaPersone[3]
    }
  }
  axios.put('https://api.jsonbin.io/b/' + binID, data, true)
  // sta roba di mandare un PUT con una sola riga mi esalta tantissimo
}

function JSONReset(ctx) {
  if (crypto.authenticateMe(ctx.state.command.splitArgs[0])) {
    let data = {
      'troyota:': {
        posto1: '',
        posto2: '',
        posto3: '',
        posto4: ''
      }
    }
    axios.put('https://api.jsonbin.io/b/' + binID, data, true)
    console.log('Reset avvenuto')
    ctx.reply('Reset avvenuto 😇')
  } else {
    ctx.reply('Password errata, riprova.')
  }
}

const createMessageText = listaPersone => {
  let outputString = 'Elenco delle persone già in macchina:' + '\n'
  listaPersone.forEach(nome => {
    outputString += nome + '\n'
  })
  return outputString
}

const capitalize = s => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}
