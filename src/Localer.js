import weekData from 'cldr-core/supplemental/weekData.json';
import languageData from 'cldr-core/supplemental/languageData.json';
import codeMappings from 'cldr-core/supplemental/codeMappings.json';
class Localer {

    locale;//wants the js language-region format 
    localeDateFormat;
    

    constructor(locale, localeDateFormat) {
        this.locale = locale;
        this.localeDateFormat = localeDateFormat;
    }

    localeDayOfWeek(calDate) {
        var lDate = new Date(calDate).toLocaleString(this.locale, { weekday: this.localeDateFormat });
        var dayOfWeek = 0;
        var dayNames = this.getDayNames();
        for (let i = 0; i < dayNames.length; i++) {
            if (dayNames[i] === lDate) {
                dayOfWeek = i;
                break;
            }
        }
        return dayOfWeek;
    }

    getFirstDayForLocale() {
        var firstDayJson = weekData.supplemental.weekData.firstDay;
        var firstDay = "sun";
        const regionForWeekData = this.localeMapper(this.locale).get("region");
        var loc = Object.keys(firstDayJson)
            .find(key => key === regionForWeekData);
        if (loc) {
            firstDay = firstDayJson[loc];
        }
        return firstDay;
    }

    getLocaleFirstDayOffset() {
        var offset;
        switch (this.getFirstDayForLocale()) {
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
        return this.getWeekdayNames(this.locale, this.localeDateFormat);
    }

    localeResolver(localeToResolve) {

        let lLocale = localeToResolve;

        //ISO 639-2 Code length === 3
        //may not get correct order of days of week
        let isIso639_2 = lLocale.length === 3;
        if (!isIso639_2) {
            lLocale = Intl.getCanonicalLocales(lLocale)[0];
        } else {
            //3 letter locales are shortcuts to language-region
            //e.g. usa = en-US, fra = fr-FR, can = en-CA, mex = es-MX, aut = de-AT
            lLocale = this.alpha3Search(lLocale);
        }

        //2 letter locales are treated as regions, not languages
        //regions have first days, languages do not
        if (lLocale.length === 2) {
            return this.regionLanguageSearch(lLocale);
        }

        return lLocale;
    }

    alpha3Search(locale) {

        let lLocale = locale;
        let _codeMappings = codeMappings.supplemental.codeMappings;

        const supportedAlpha3Regions = Object.keys(_codeMappings)
            .reduce((obj, key) => this.dataReducer(_codeMappings, obj, key, "_alpha3"), {});

        const mappingDataSearcher = function (searchme, findme) {
            let lFindme = findme.toUpperCase();
            for (let key in searchme) {
                const item = searchme[key];
                var found = item === lFindme;
                if (found) {
                    return key;
                }
            }
            return lLocale;
        }
        return mappingDataSearcher(supportedAlpha3Regions, lLocale);
    }

    localeMapper(localeToMap) {
        const lLocale = localeToMap; //2 (e.g. US) or 4(en-US) char locale
        const lLocaleAry = lLocale.split("-");
        let language = lLocaleAry[0].toLowerCase();
        let region = (undefined !== lLocaleAry[1]) ? lLocaleAry[1].toUpperCase() : lLocaleAry[0].toUpperCase();
        let localeMap = new Map();
        localeMap.set("language", language);
        localeMap.set("region", region);
        return localeMap;
    }

    dataReducer(data, obj, key, keyName) {
        if (undefined !== data[key][keyName]) {
            obj[key] = data[key][keyName];
        }
        return obj;
    }

    regionLanguageSearch(localeToSearch) {

        let language = "en";
        let region = localeToSearch.toUpperCase();
        const langData = languageData.supplemental.languageData;

        //first language found for the region(in _territories) is the winner
        const langDataSearch = function (dataToSearch, findItem) {
            const lDataToSearch = dataToSearch;
            const lFindItem = findItem;
            for (let lang in lDataToSearch) {
                const item = lDataToSearch[lang];
                var found = (item.indexOf(lFindItem) !== -1);
                if (found) {
                    return lang;
                }
            }
            return "";
        }
        //this should handle most requests
        const supportedPrimaryLangs = Object.keys(langData)
            .filter(key => (key.length === 2 || key.length === 3))
            .reduce((obj, key) => this.dataReducer(langData, obj, key, "_territories"), {});

        var langCodeSearch = langDataSearch(supportedPrimaryLangs, region);

        if (langCodeSearch.length > 0) {
            language = langCodeSearch;
        } else {
            const dataReducer2 = function (data, obj, key, keyName) {
                if (undefined !== data[key][keyName]) {
                    let keyAry = key.split("-");
                    let newKey = keyAry[0];
                    obj[newKey] = data[key][keyName];
                }
                return obj;
            }
            const supportedSecondaryLangs = Object.keys(langData)
                .filter(key => (key.endsWith("-alt-secondary")))
                .reduce((obj, key) => dataReducer2(langData, obj, key, "_territories"), {});
            langCodeSearch = langDataSearch(supportedSecondaryLangs, region);

            if (langCodeSearch.length > 0) {
                language = langCodeSearch
            };
        }
        let locale = language + "-" + region;
        return Intl.getCanonicalLocales(locale)[0];
    }

    getWeekdayNames(glocale, gstyle) {
        let lLocale = glocale;

        var lStyle = gstyle; //long or short
        var dayNames = [];
        //jan 5 - 11 2020 is Sunday - Saturday
        var startYear = 2020;
        var startMonth = 0;
        var startDay = 5;
        var offset = this.getLocaleFirstDayOffset();
        var localeStartDay = startDay + offset;
        for (let day = localeStartDay; day <= localeStartDay + 6; day++) {
            let dayName = new Date(startYear, startMonth, day)
                .toLocaleString(lLocale, { weekday: lStyle });
            dayNames.push(dayName);
        }
        //var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
        return dayNames;
    }
}
export default Localer;