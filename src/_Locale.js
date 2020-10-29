class _Locale {
    baseName;
    language;
    region;

    constructor(localeStr){
        let lBaseName = ""+localeStr.toString();
        let lLocaleAry = lBaseName.split("-");
        if(lLocaleAry.length == 1){
            lBaseName = lLocaleAry[0].toLowerCase();
        }
        this.baseName = lBaseName;
        this.language = lLocaleAry[0].toLowerCase();
        this.region = (undefined !== lLocaleAry[1]) ? lLocaleAry[1].toUpperCase() : undefined;
    }

    toString(){
        return this.baseName;
    }
}
export default _Locale;