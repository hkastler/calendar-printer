import css from './calendar.css';
import Localer from './Localer.js';
class CalendarPrinter extends HTMLElement {

    calendarDate;
    locale;
    localeDateFormat;
    localer;
    dayNames;
    searchParams;
    allowedParams;
    displayMode;

    constructor() {
        super();
        const rightNow = new Date();
        this.calendarDate = new Date(rightNow.getFullYear(), rightNow.getMonth());
        this.locale = this.getLang();
        this.localeDateFormat = "long";
        this.searchParams = new URLSearchParams(window.location.search);
        this.localer = new Localer(this.locale, this.localeDateFormat);
        this.allowedParams = ["m","loc","dsp","ldf"];
        this.displayMode = "flex"; //or table
    }

    connectedCallback() {
        const calDate = this.searchParams.get('m');
        if (calDate !== null) {
            let dateParts = calDate.split("/");
            let year = dateParts[1];
            //m is display month
            let month = (dateParts[0] - 1);
            this.calendarDate = new Date(year, month);
        }
        let needsRefresh = false;
        const loc = this.searchParams.get('loc');
        if (loc !== null && (loc !== this.locale)) {
            this.locale = this.localer.localeResolver(loc);
            needsRefresh = true;
        }
        const dsp = this.searchParams.get('dsp');
        if (dsp !== null && (dsp !== this.displayMode)) {
            this.displayMode = dsp;
        }
        const ldf = this.searchParams.get('ldf');
        if (ldf !== null && (ldf !== this.localeDateFormat)) {
            this.localeDateFormat = ldf;
            needsRefresh = true;
        }
        if(needsRefresh){
            this.localer.refresh(this.locale, this.localeDateFormat);
        }
        this.dayNames = this.localer.dayNames;
        this.render();
    }

    render() {
        this.appendChild(this.calendarTable(this.calendarDate));
    }

    calendarTable(incomingDate) {

        const calendarDate = new Date(incomingDate.getFullYear(), incomingDate.getMonth(), 1);
        const calendarYear = calendarDate.getFullYear();
        const calendarMonth = calendarDate.getMonth();
        const displayCalendarMonth = calendarMonth + 1;
        const lastDateOfCalendarDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        //table
        var calTable = this.createTableElement("table");
        calTable.id = "calendarTable";
        calTable.className += " table table-striped table-responsive";

        //thead
        var tHead = this.createTableElement("thead");
        tHead.className += " thead-default text-center";

        //top row, month and nav arrows
        //part of the table head, but not table header information
        var tr = this.createTableElement("tr");
        tr.className += " toprow";
        //previous arrow cell
        var td = this.toprowTemplate(["td","1"]);
        td.className += " text-left"
        var previousMonth = displayCalendarMonth - 1;
        var dateLink = previousMonth + "/" + calendarYear;
        var aDateLink = this.arrowTemplate([dateLink, "left", this.svgArrowLeftCircle()]);
        td.appendChild(aDateLink);
        tr.appendChild(td);

        //month and year colspan
        td = this.toprowTemplate(["td","5"]);
        const formatter = new Intl.DateTimeFormat(this.locale, { month: this.localeDateFormat });
        const calendarDateMonthText = formatter.format(calendarDate);
        const text = calendarDateMonthText + " " + calendarYear;
        td.appendChild(document.createTextNode(text));
        tr.appendChild(td);

        //next arrow cell
        td = this.toprowTemplate(["td","1"]);
        td.className += " text-right"
        var nextMonth = displayCalendarMonth + 1;
        dateLink = nextMonth + "/" + calendarYear;
        aDateLink = this.arrowTemplate([dateLink, "right", this.svgArrowRightCircle()]);
        td.appendChild(aDateLink);
        tr.appendChild(td);

        tHead.appendChild(tr);
        //top row closed

        //days of week row
        tr = this.createTableElement("tr");
        tr.className += " daynames";
        this.dayNames.forEach(dayName => {
            let th = this.createTableElement("th");
            let text = document.createTextNode(dayName);
            th.appendChild(text);
            tr.appendChild(th);
        });
        tHead.appendChild(tr);
        calTable.appendChild(tHead);
        //thead closed
        
        //find out true day of week
        //javascript defaults to sunday=0
        //but in many locales, monday=0 and sunday=6
        var dayOfWeek = this.localer.localeDayOfWeek(calendarDate);
        
        //tBody
        var tBody = this.createTableElement("tbody");
        tBody.className += " text-right";
        //open the row
        tr = this.createTableElement("tr");

        //how many non-date td to print
        //print the cells not part of the month 
        //but part of the first week
        for (let i = 0; i < dayOfWeek; i++) {
            td = this.createTableElement("td");
            tr.appendChild(td);
        }

        for (let dateOfMonth = 1; dateOfMonth <= lastDateOfCalendarDate; dateOfMonth++) {
            //if the dayOfWeek[0-6] is greater than 6;
            //close the week out and start a new one
            if (dayOfWeek > 6) {
                tBody.appendChild(tr);
                dayOfWeek = 0;
                tr = this.createTableElement("tr");
            }

            //the td(s) with the number
            var isoDate = new Date(calendarYear, calendarMonth, dateOfMonth,0,0,0,0);
            td = this.tdIdTemplate([isoDate.toISOString()]);
            var span = document.createElement("span");
            span.className = "topright";
            
            let cellText = dateOfMonth;
            span.appendChild(document.createTextNode(cellText));
            td.appendChild(span);

            tr.appendChild(td);

            //fill last row with cells if needed
            if (dateOfMonth == lastDateOfCalendarDate) {
                let tdPad = 6 - dayOfWeek;
                for (let t = 0; t < tdPad; t++) {
                    td = this.createTableElement("td");
                    tr.appendChild(td);
                }
            }

            ++dayOfWeek;
        }

        tBody.appendChild(tr);
        calTable.appendChild(tBody);

        return calTable;
    }

    createTableElement(tablePart){
        let elem;
        if(this.displayMode === "table"){
            elem = document.createElement(tablePart);
        } else {
            elem = document.createElement("div");
            elem.className = tablePart + "-" + this.displayMode;
        }
        return elem;
    }


    arrowTemplate(args) {
        //template = "<a id=\"arrow-{1}\" href=\"date/{0}\">{2}</a>"
        var a = document.createElement("a");
        a.className = "arrow";
        a.id = "arrow-" + args[1];

        var newQs = new URLSearchParams();
        var monthParamName = "m";
        var localeParamName = "loc";
        var mFound = false;
        this.searchParams.forEach((value, key) =>{
            if (key === monthParamName) {
                value = args[0];
                mFound = true;
            } else if (key === localeParamName){
                value = this.localer.localeResolver(value);
            }
            if (this.allowedParams.indexOf(key) !== -1) {
                newQs.set(key, value);
            }
        });
        if (!mFound) {
            newQs.set(monthParamName, args[0]);
        }
        a.href = "?" + newQs;

        let dspArrow = args[2];
        a.appendChild(document.createRange().createContextualFragment(dspArrow));

        //to get the query string/new page back
        //remove this onclick event
        a.onclick = (event) => {
            try {
                event.preventDefault();
                event.stopImmediatePropagation();
            } catch (err) {
                console.log(err);
            }
            this.searchParams = new URLSearchParams(newQs);
            this.innerHTML = "";
            //window.history.pushState("", "", a.href);
            this.connectedCallback();
        };
        return a;
    }

    //https://icons.getbootstrap.com/icons/arrow-left-circle/
    svgArrowLeftCircle() {
         return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-left-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
</svg>`;
    }
    //https://icons.getbootstrap.com/icons/arrow-right-circle/
    svgArrowRightCircle() {
        return `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-right-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path fill-rule="evenodd" d="M4 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5A.5.5 0 0 0 4 8z"/>
</svg>`;
    }

    toprowTemplate(args) {
        //template = "<{0} colspan=\"{1}\" >";
        let elem = this.createTableElement(args[0]);
        if(this.displayMode === "table"){
            elem.setAttribute("colspan", args[1]);
        } else {

        }
        return elem;
    }

    tdIdTemplate(args) {
        // template = "<td id=\"date{0}\">";
        var td = this.createTableElement("td");
        td.id = "date_".concat(args[0]);
        return td;
    }

    getLang(){
        return navigator.language || navigator.browserLanguage || (navigator.languages || ["en-US"])[0]
    }

    onLoadEnd() {
        //console.log("onLoadEnd");
    }
}
customElements.define('calendar-printer', CalendarPrinter);
