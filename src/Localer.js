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

    refresh(pLoc, pLdf) {
        this.locale = pLoc;
        this.localeDateFormat = pLdf;
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

    localeResolver(localeToResolve) {
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
        const langData = languageData.supplemental.languageData;

        const langDataReduce = function(data, obj, key){
            if (undefined !== data[key]["_territories"]) {
                obj[key] = data[key]["_territories"];
            }
            return obj;
        };

        const langDataSearch = function (searchme, findme) {
            for (let key in searchme) {
                const item = searchme[key];
                var found = item.indexOf(findme);
                if (found !== -1) {
                    let keyAry = key.split("-");
                    return keyAry[0];
                }
            }
            return "";
        }

        const supportedPrimaryLangs = Object.keys(langData)
            .filter(key => (key.length === 2))
            .reduce((obj, key) => langDataReduce(langData,obj,key), {});

        var langCodeSearch = langDataSearch(supportedPrimaryLangs, lLocale);

        if (langCodeSearch.length > 0) {
            langCode = langCodeSearch;
        } else {
            const supportedSecondaryLangs = Object.keys(langData)
                .filter(key => (key.endsWith("-alt-secondary")))
                .reduce((obj, key) => langDataReduce(langData,obj,key), {});
            langCodeSearch = langDataSearch(supportedSecondaryLangs, lLocale);
            if(langCodeSearch.length > 0){langCode = langCodeSearch};
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