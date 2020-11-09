import weekData from 'cldr-core/supplemental/weekData.json';
import languageData from 'cldr-core/supplemental/languageData.json';
import availableLocales from 'cldr-core/availableLocales.json';
import _Locale from './_Locale';
class Localer {

    locale;//there are many formats 
    localeDateFormatOptions;

    constructor(locale, localeDateFormatOptions) {
        try {
            this.locale = new Intl.Locale(locale);
        } catch (err) {
            this.locale = new _Locale(locale.toString());
        }

        this.localeDateFormatOptions = localeDateFormatOptions;
    }

    localeDayOfWeek(calDate) {
        const lDate = calDate;
        const weekday = new Date(lDate)
            .toLocaleString(this.locale, { weekday: this.localeDateFormatOptions.weekday });
        let dayOfWeek = 0;
        const dayNames = this.getWeekdayNames();
        for (let i = 0; i < dayNames.length; i++) {
            if (dayNames[i] === weekday) {
                dayOfWeek = i;
                break;
            }
        }
        return dayOfWeek;
    }

    getFirstDayForRegion() {
        let firstDay = "sun";
        const regionFirstDays = weekData.supplemental.weekData.firstDay;
        const lRegion = this.locale.region;
        return (undefined !== regionFirstDays[lRegion]) ? regionFirstDays[lRegion] : firstDay;
    }

    getLocaleFirstDayOffset() {
        let offset;
        switch (this.getFirstDayForRegion()) {
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

    setLocaleFromIdentifier(localeIdentifier) {
        let lLocaleId = localeIdentifier;
        let lLocale;
        try {
            //2 letter param(lower or uppercase) is lang to the constructor
            //3 letter languages are considered valid locales
            //will not have a region
            lLocale = new Intl.Locale(lLocaleId);

            if (undefined === lLocale.region) {
                lLocale = new Intl.Locale(this.localeRegionResolver(lLocaleId));
            }

        } catch (err) {
            lLocale = new _Locale(localeIdentifier);
            if (undefined === lLocale.region) {
                lLocale = new _Locale(this.localeRegionResolver(localeIdentifier));
            }
            console.log(err.message);
        }
        this.locale = lLocale;
    }

    localeRegionResolver(localeToResolve) {

        /*An IETF BCP 47 language tag 
        A Unicode BCP 47 locale identifier consists of
        a language code,
        (optionally) a script code,
        (optionally) a region (or country) code,
        (optionally) one or more variant codes, and
        (optionally) one or more extension sequences,*/
        let lLocale = localeToResolve;
        

        //try to find a language-region fit 
        if (lLocale.length === 2) {
            lLocale = this.getTerritoryForLangCode(lLocale);
        }

        return lLocale;
    }

    alpha3Search(locale) {

        let lLocale = locale;
        return lLocale;
        //const _codeMappings = codeMappings.supplemental.codeMappings;
        //const territories = _codeMappings[lLocale]._alpha3;
        //console.log(territories)
        //return mappingDataSearcher(supportedAlpha3Regions, lLocale);
    }



    getTerritoryForLangCode(langCode) {
        const lLangCode = langCode; //ISO 639-1 alpha-2
        const langData = languageData.supplemental.languageData;
        
        let territories;
        try{
            territories = langData[lLangCode]._territories;
        } catch(e){

        }
        
        const defaultLangRegion = lLangCode.toUpperCase(); //ISO 3166-1 alpha-2

        let region = "";
        let hasDefaultRegion = false;
        if (undefined !== territories) {
            if (territories.indexOf(defaultLangRegion) !== -1) {
                region = "-" + defaultLangRegion;
                hasDefaultRegion = true;
            }

            if (!hasDefaultRegion) {
                region = "-" + territories[0];
            }
        }
        
        return langCode + region;
    }

    getWeekdayNames() {

        let lLocale = this.locale;
        var lStyle = this.localeDateFormatOptions.weekday; //long, short, or narrow
        var dayNames = [];
        //jan 5 - 11 2020 is Sunday - Saturday
        const startYear = 2020;
        const startMonth = 0;
        var startDay = 5;
        const offset = this.getLocaleFirstDayOffset();
        const localeStartDay = startDay + offset;

        for (let day = localeStartDay; day <= localeStartDay + 6; day++) {
            let dayName = new Date(startYear, startMonth, day)
                .toLocaleString(lLocale, { weekday: lStyle });
            dayNames.push(dayName);
        }
        //var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
        return dayNames;
    }

    getAvailableLocalesFull() {
        return availableLocales.availableLocales.full;
    }
}
export default Localer;