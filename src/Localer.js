import weekData from 'cldr-core/supplemental/weekData.json';
import languageData from 'cldr-core/supplemental/languageData.json';

class Localer {

    locale;
    localeDateFormat;
    dayNames;
    firstDay;

    constructor(locale, localeDateFormat) {
        this.locale = locale;
        this.localeDateFormat = localeDateFormat;
        this.firstDay = this.getFirstDayForLocale();
        this.dayNames = this.getDayNames();
    }

    refresh(pLoc){
        this.locale = pLoc;
        this.firstDay = this.getFirstDayForLocale();
        this.dayNames = this.getDayNames();
    }

    localeDayOfWeek(calDate) {
        var lDate = new Date(calDate).toLocaleString(this.locale, { weekday: this.localeDateFormat });
        var dayOfWeek = 0;
        for (let i = 0; i < this.dayNames.length; i++) {
            if (this.dayNames[i] === lDate) {
                dayOfWeek = i;
                break;
            }
        }
        return dayOfWeek;
    }

    getFirstDayForLocale() {
        var firstDayJson = weekData.supplemental.weekData.firstDay;
        var firstDay = "sun";
        const localeForWeekData = this.localeSplitter(this.locale);
        var loc = Object.keys(firstDayJson)
            .find(key => key === localeForWeekData);
        if (loc) {
            firstDay = firstDayJson[loc];
        }
        return firstDay;
    }

    getLocaleFirstDayOffset() {
        var offset;
        switch (this.firstDay) {
            case 'fri':
                offset = -2;
                break;
            case 'sat':
                offset = -1;
                break;
            case 'sun':
                offset = 0;
                break;
            case 'mon':
                offset = 1;
                break;
            default:
                offset = 0;
        }
        return offset;
    }

    getDayNames() {
        return this.generateDayNames(this.localeResolver(this.locale), this.localeDateFormat);
    }

    localeResolver(localeToResolve){
        let lLocale = localeToResolve;
        if (lLocale.length == 2) {
            lLocale = this.expandedLocaleSearch(lLocale);
        }
        return lLocale;
    }

    localeSplitter(localeToSplit) {
        var lLocale = localeToSplit; //2 (e.g. US) or 4(en-US) char locale
        var lLocaleAry = lLocale.split("-");
        if (lLocaleAry.length > 1) {
            lLocale = lLocaleAry[1];
        }
        return lLocale;
    }

    expandedLocaleSearch(localeToSearch) {
        var langCode = "en";
        let lLocale = localeToSearch;
        var langData = languageData.supplemental.languageData;
        for (let lang in langData) {
            const item = langData[lang];
            const territories = Object.keys(item).filter(key => { return key === '_territories' });
            territories.forEach((code) => {
                for (let t in item[code]) {
                    let lCode = item[code][t];
                    if (lLocale === lCode) {
                        if (lang.length == 2) {
                            langCode = lang;
                            break;
                        }
                    }
                }
            });
        }
        return langCode + "-" + lLocale;
    }

    generateDayNames(glocale, gstyle) {
        let lLocale = glocale; //2 (e.g. US) or 4(en-US) char locale
        
        var lStyle = gstyle; //long or short
        var dayNames = [];
        //jan 5 - 11 2020 is Sunday - Saturday
        var startYear = 2020;
        var startMonth = 0;
        var startDay = 5;
        var offset = this.getLocaleFirstDayOffset();
        var localeStartDay = startDay + offset;
        for (let day = localeStartDay; day <= localeStartDay + 6; day++) {
            let dayName = new Date(startYear, startMonth, day).toLocaleString(lLocale, { weekday: lStyle });
            dayNames.push(dayName);
        }
        //var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
        return dayNames;
    }
}
export default Localer;