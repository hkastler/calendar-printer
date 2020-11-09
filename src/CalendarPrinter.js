import css from './calendar.css';
import Localer from './Localer.js';
import _Locale from './_Locale';
class CalendarPrinter extends HTMLElement {

    calendarDate;
    locale;
    localeDateFormatOptions = {
        weekday: "short", // narrow' | 'short' | 'long' 
        month: "short",  //'numeric' | '2-digit' | 'narrow' | 'short' | 'long'
        year: "numeric", //'numeric' | '2-digit',
        day: "numeric", //'numeric' | '2-digit',
        numeric: "numeric",
        digits: "2-digit",
        long: "long",
        narrow: "narrow",
        short: "short"
    };
    localer;
    weekdayNames = [];
    searchParams;
    allowedParams = ["m", "loc", "dsp", "ldf"];
    displayMode = "flex"; //or table;
    observedElem;
    obsElemSize = 0;

    constructor() {
        super();
        const rightNow = new Date();
        this.calendarDate = new Date(rightNow.getFullYear(), rightNow.getMonth());
        try {
            this.locale = new Intl.Locale(this.getLang());
        } catch (err) {
            this.locale = new _Locale(this.getLang());
        }

        this.observedElem = document.querySelector('html');
        this.obsElemSize = this.observedElem.clientWidth;
        if (this.obsElemSize > 640) {
            this.localeDateFormatOptions.weekday = this.localeDateFormatOptions.long,
                this.localeDateFormatOptions.month = this.localeDateFormatOptions.long
        }
        this.localer = new Localer(this.locale, this.localeDateFormatOptions);

        this.searchParams = new URLSearchParams(window.location.search);

        this.observeElem();
    }

    connectedCallback() {
        this.processParams();
        this.getWeekdayNames();
        this.render();
    }

    processParams() {
        const dsp = this.searchParams.get('dsp');
        if (dsp !== null && (dsp !== this.displayMode)) {
            this.displayMode = dsp;
        }

        const calDate = this.searchParams.get('m');
        if (calDate !== null) {
            let dateParts = calDate.split("/");
            let year = dateParts[1];
            //m is display month
            let month = (dateParts[0] - 1);
            this.calendarDate = new Date(year, month);
        }

        const loc = this.searchParams.get('loc');
        if (loc !== null && (loc !== this.locale)) {
            this.localer.setLocaleFromIdentifier(loc);
            this.locale = this.localer.locale;            
        }

        const ldf = this.searchParams.get('ldf');
        if (ldf !== null && (ldf !== this.localeDateFormatOptions)) {
            this.localeDateFormatOptions.month = ldf;
            this.localeDateFormatOptions.weekday = ldf;
            if (ldf === this.localeDateFormatOptions.narrow) {
                this.localeDateFormatOptions.year = this.localeDateFormatOptions.digits
            }
            this.localer.localeDateFormatOptions = this.localeDateFormatOptions;
        }
    }

    getWeekdayNames() {
        if (this.weekdayNames.length === 0) {
            this.weekdayNames = this.localer.getWeekdayNames();
        }
    }


    render() {
        let localeSelect = this.availableLocalesSelect();
        this.appendChild(localeSelect.select);
        let langName = this.locale.language;
        let regionName = this.locale.region;
        let text =  "";
        try{
            langName = new Intl.DisplayNames([this.getLang()], { type: 'language' });
            regionName = new Intl.DisplayNames([this.getLang()], { type: 'region' });
            text = document.createTextNode("language: " + langName.of(this.locale.language) + " region:" + regionName.of(this.locale.region));
        } catch(e) {
            text =  document.createTextNode("language: " + langName + " region:" + regionName);
        }
        
        
        this.appendChild(text);
        this.appendChild(this.calendarTable(this.calendarDate));
        this.lang = this.locale.language;
    }

    observeElem() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry) {
                    let newElemSize = entry.target.clientWidth;

                    if (undefined !== newElemSize && this.obsElemSize !== newElemSize) {
                        let passedWidthThreshold = (newElemSize < 640);

                        if (passedWidthThreshold) {
                            this.localeDateFormatOptions.weekday = this.localeDateFormatOptions.short;
                            this.localeDateFormatOptions.month = this.localeDateFormatOptions.short;
                        } else {
                            this.localeDateFormatOptions.weekday = this.localeDateFormatOptions.long;
                            this.localeDateFormatOptions.month = this.localeDateFormatOptions.long;
                        }

                        this.localer.localeDateFormatOptions = this.localeDateFormatOptions;
                        this.processParams();
                        this.weekdayNames = [];
                        this.getWeekdayNames();
                        this.innerHTML = "";
                        this.render();
                        this.obsElemSize = newElemSize;
                    }

                }
            }
        });
        resizeObserver.observe(this.observedElem);
    }


    calendarTable(incomingDate) {

        const calendarDate = new Date(incomingDate.getFullYear(), incomingDate.getMonth(), 1);
        const calendarYear = calendarDate.getFullYear();
        const calendarMonth = calendarDate.getMonth();
        const lastDateOfCalendarDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const trs = "tr";
        const tds = "td";

        //table
        var calTable = this.createTableElement("table");
        calTable.id = "calendarTable";
        calTable.className += " table table-striped table-responsive";

        //thead
        var tHead = this.createTableElement("thead");
        tHead.className += " thead-default text-center";

        //top row, month and nav arrows
        //part of the table head, but not table header information
        var tr = this.createTableElement(trs);
        tr.className += " toprow";
        //previous arrow cell
        var td = this.toprowTemplate({ tElem: tds, colspan: "1" });
        td.className += " left"

        const dateLinkFormatter = new Intl.DateTimeFormat("default", {
            month: this.localeDateFormatOptions.numeric,
            year: this.localeDateFormatOptions.numeric
        });
        var previousMonth = new Date(calendarYear, calendarMonth - 1);
        var dateLink = dateLinkFormatter.format(previousMonth);
        var aDateLink = this.arrowTemplate({ dateLink: dateLink, arrowId: "left", dspArrow: this.svgArrowLeftCircle() });
        td.appendChild(aDateLink);
        tr.appendChild(td);

        //month and year colspan
        td = this.toprowTemplate({ tElem: tds, colspan: "5" });
        td.className += " center";

        const monthFormatter = new Intl.DateTimeFormat(this.locale, {
            month: this.localeDateFormatOptions.month,
            year: this.localeDateFormatOptions.year
        });
        const calendarDateMonthText = monthFormatter.format(calendarDate);
        const text = calendarDateMonthText;
        td.appendChild(document.createTextNode(text));
        tr.appendChild(td);

        //next arrow cell
        td = this.toprowTemplate({ tElem: tds, colspan: "1" });
        td.className += " right"
        var nextMonth = new Date(calendarYear, calendarMonth + 1);
        dateLink = dateLinkFormatter.format(nextMonth);
        aDateLink = this.arrowTemplate({ dateLink: dateLink, arrowId: "right", dspArrow: this.svgArrowRightCircle() });
        td.appendChild(aDateLink);
        tr.appendChild(td);

        tHead.appendChild(tr);
        //top row closed

        //days of week row
        tr = this.createTableElement(trs);
        tr.className += " daynames";
        const ths = "th";
        this.weekdayNames.forEach(dayName => {
            let th = this.createTableElement(ths);
            let text = document.createTextNode(dayName);
            th.appendChild(text);
            tr.appendChild(th);
        });
        tHead.appendChild(tr);
        calTable.appendChild(tHead);
        //thead closed

        //tBody
        var tBody = this.createTableElement("tbody");

        //open the row
        tr = this.createTableElement(trs);

        //find out true day of week for the calendar start date
        //javascript defaults to sunday=0
        //but in many locales, monday=0 and sunday=6
        //from dayNames we know the order
        //find the index of the weekday in the weekdays
        var dayOfWeek = this.calendarDayOfWeek(calendarDate);

        //how many non-date td to print
        //print the cells not part of the month 
        //but part of the first week
        for (let i = 0; i < dayOfWeek; i++) {
            td = this.createTableElement(tds);
            tr.appendChild(td);
        }

        for (let dateOfMonth = 1; dateOfMonth <= lastDateOfCalendarDate; dateOfMonth++) {
            //if the dayOfWeek[0-6] is greater than 6;
            //close the week out and start a new one
            if (dayOfWeek > 6) {
                tBody.appendChild(tr);
                dayOfWeek = 0;
                tr = this.createTableElement(trs);
            }

            //the td(s) with the number
            var isoDate = new Date(calendarYear, calendarMonth, dateOfMonth, 0, 0, 0, 0);
            td = this.tdIdTemplate({ td: tds, date: isoDate.toISOString() });
            var span = document.createElement("span");
            span.className = "topright";
            const dayFormatter = new Intl.DateTimeFormat(this.locale, {
                day: this.localeDateFormatOptions.day
            });
            const dateText = dayFormatter.format(isoDate);
            let cellText = dateText;
            span.appendChild(document.createTextNode(cellText));
            td.appendChild(span);

            tr.appendChild(td);

            //fill last row with cells if needed
            if (dateOfMonth == lastDateOfCalendarDate) {
                let tdPad = 6 - dayOfWeek;
                for (let t = 0; t < tdPad; t++) {
                    td = this.createTableElement(tds);
                    tr.appendChild(td);
                }
            }

            ++dayOfWeek;
        }

        tBody.appendChild(tr);
        calTable.appendChild(tBody);

        return calTable;
    }

    calendarDayOfWeek(calDate) {
        var lDate = new Date(calDate)
            .toLocaleString(this.locale, { weekday: this.localeDateFormatOptions.weekday });
        for (let i = 0; i < this.weekdayNames.length; i++) {
            if (this.weekdayNames[i] === lDate) {
                return i;
            }
        }
    }

    createTableElement(tablePart) {
        let elem;
        if (this.displayMode === "table") {
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
        a.id = "arrow-" + args.arrowId;

        var newQs = new URLSearchParams();
        var monthParamName = "m";
        var localeParamName = "loc";
        var mFound = false;
        this.searchParams.forEach((value, key) => {
            if (key === monthParamName) {
                value = args.dateLink;
                mFound = true;
            } else if (key === localeParamName) {
                value = this.locale;
            }
            if (this.allowedParams.indexOf(key) !== -1) {
                newQs.set(key, value);
            }
        });
        if (!mFound) {
            newQs.set(monthParamName, args.dateLink);
        }
        a.href = "?" + newQs;

        let dspArrow = args.dspArrow;
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
        return `<svg viewBox="0 0 16 16" class="bi bi-arrow-left-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
</svg>`;
    }
    //https://icons.getbootstrap.com/icons/arrow-right-circle/
    svgArrowRightCircle() {
        return `<svg viewBox="0 0 16 16" class="bi bi-arrow-right-circle" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path fill-rule="evenodd" d="M4 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5A.5.5 0 0 0 4 8z"/>
</svg>`;
    }

    toprowTemplate(args) {
        //template = "<{0} colspan=\"{1}\" >";
        let elem = this.createTableElement(args.tElem);
        if (this.displayMode === "table") {
            elem.setAttribute("colspan", args.colspan);
        } else {

        }
        return elem;
    }

    tdIdTemplate(args) {
        // template = "<td id=\"date{0}\">";
        var td = this.createTableElement(args.td);
        td.id = "date_" + args.date;
        return td;
    }

    getLang() {
        return navigator.language || navigator.browserLanguage || (navigator.languages || ["en-US"])[0]
    }

    availableLocalesSelect() {
        const lAvailableLocales = this.localer.getAvailableLocalesFull();
        const selectName = "availableLocales";

        var label = document.createElement("label");
        label.setAttribute("for", selectName);
        label.innerHTML = "Available Locales:";

        var select = document.createElement("select");
        select.id = selectName;
             

        for (let i = 0; i < lAvailableLocales.length; i++) {
            var option = document.createElement("option");
            option.value = lAvailableLocales[i];
            option.textContent = option.value;
            let match1 = (option.value === this.locale.language),
                match2 = (option.value === this.locale.baseName);
            if (match1 || match2) {
                option.selected = true;
            }
            select.appendChild(option);
        };

        select.onchange = () => {
            this.localer.setLocaleFromIdentifier(select.value);
            this.locale = this.localer.locale;
            this.localer.locale = this.locale;
            this.processParams();
            this.weekdayNames = [];
            this.getWeekdayNames();
            this.innerHTML = "";
            this.render();
        };
        let returnObj = {
            label: label,
            select: select
        };
        return returnObj;
    }

    onLoadEnd() {

    }
}
customElements.define('calendar-printer', CalendarPrinter);

