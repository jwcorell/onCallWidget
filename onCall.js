// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;
// Adapted heavily from Github yaylinda/scriptable/CalendarEventsWidget.js

const dateFormat1 = new Intl.DateTimeFormat('en-US', { weekday: 'long', });
const dateFormat2 = new Intl.DateTimeFormat('en-US', { month: 'short', });
const dateFormat3 = new Intl.DateTimeFormat('en-US', { day: 'numeric', });

const GLOBAL = {
  calendar: 'On-Call',

  // Calendar callback app
  //   - calshow - Default iOS Calendar
  //   - googlecalendar - Google Calendar
  //   - x-fantastical3 - Fantastical
  callbackCalendarApp: 'calshow', 

  bgColorNow: new Color("#FF7700"),
  bgColorLater: new Color("#FFE900"),
  bgColorNone: new Color("#007700"),
  font: 'Arial',
  fontColor: Color.black(),
  fontSize: 25,
  
  stackHeight: 80,
  stackWidth: 175,
  stackBorderColor: Color.black(),
  stackBorderWidth: 0,
  stackSpacing: 10,
  
  onCallNo: 0,
  onCallLater: 1,
  onCallYes: 2
};

function drawStack(stack, date, status, widget, onCall) {
  const stackNested = stack.addStack();
  const day = dateFormat1.format(date)
  const month = dateFormat2.format(date)
  const num = dateFormat3.format(date)
  stack.size = new Size(GLOBAL.stackWidth, GLOBAL.stackHeight);
  stack.layoutVertically();
  stack.centerAlignContent();
  stack.borderColor = GLOBAL.stackBorderColor;
  stack.borderWidth = GLOBAL.stackBorderWidth;
  stackNested.layoutVertically();
  const dateText1 = stackNested.addText("   " + day);
  const dateText2 = stackNested.addText("   " + month + " " + num);
  dateText1.textColor = GLOBAL.fontColor;
  dateText1.font = new Font(GLOBAL.font, GLOBAL.fontSize);
  dateText2.textColor = GLOBAL.fontColor;
  dateText2.font = new Font(GLOBAL.font, GLOBAL.fontSize);
  if (status == GLOBAL.onCallYes)
  {
    stack.backgroundColor = GLOBAL.bgColorNow;
  }
  else if (status == GLOBAL.onCallLater)
  {
    stack.backgroundColor = GLOBAL.bgColorLater;
  }
  else
  {
    stack.backgroundColor = GLOBAL.bgColorNone;
  }
}

async function checkForEvents()
{
  let calendar = await Calendar.forEventsByTitle(GLOBAL.calendar);
  let now = new Date();
  let nextMidnight = new Date();
  let lastMidnight = new Date();
  lastMidnight = new Date(lastMidnight.setHours(0,0,0,0));
  nextMidnight = new Date(nextMidnight.setHours(24,0,0,0));
  let todayEvents = await CalendarEvent.today([calendar]);
  let tmrwEvents = await CalendarEvent.tomorrow([calendar]);
  let restOfToday = await CalendarEvent.between(now, nextMidnight, [calendar])
  
  let todayStatus = GLOBAL.onCallNo
  let tomorrowStatus = GLOBAL.onCallNo
  todayEvents.forEach((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (now >= start && now <= end){
       todayStatus = GLOBAL.onCallYes;
    }
  });
  if (restOfToday.length > 0 && todayStatus != GLOBAL.onCallYes) {
    todayStatus = GLOBAL.onCallLater;
  }
  if (tmrwEvents.length > 0) {
    tomorrowStatus = GLOBAL.onCallLater;
  }
  return [todayStatus, tomorrowStatus];
}

const widget = new ListWidget(); 
const mainStack = widget.addStack();
const todayStack = mainStack.addStack();
const tomorrowStack = mainStack.addStack();
let status = await checkForEvents();
widget.setPadding(0,0,0,0);
mainStack.spacing = GLOBAL.stackSpacing;
mainStack.layoutVertically();
drawStack(todayStack, new Date(), status[0], widget);
drawStack(tomorrowStack, new Date().setDate(new Date().getDate()+1), status[1], widget);

if (args.widgetParameter === 'callback')
{
  const timestamp = (new Date().getTime() - new Date('2001/01/01').getTime()) / 1000;
  const callback = new CallbackURL(`${GLOBAL.callbackCalendarApp}:${timestamp}`);
  callback.open();
  Script.complete();
}
else
{
  Script.setWidget(widget);
  Script.complete();
  widget.presentSmall();
}
