/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {YES_BASE_URL} from "../config.js";
import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import got from "got";
import {CookieJar} from "tough-cookie";
import {SectionID} from "../types/section.type.js";
import {TermID} from "../types/term.type.js";

export class SectionExistsScraper extends Scraper<boolean> {

    private readonly section: SectionID;
    private readonly term: TermID

    constructor(section: SectionID, term: TermID, cookieJar?: CookieJar, startTime?: number) {
        super(cookieJar, startTime);
        this.section = section;
        this.term = term;
    }

    override async scrape(handler: StreamedResponseHandler<boolean> = (_) => {
    }): Promise<boolean[]> {
        this.markStart();

        const url = `${YES_BASE_URL}/GetClassSectionDetail.action`;
        const request = await got(url, {
            cookieJar: this.cookieJar,
            searchParams: {
                classNumber: this.section,
                termCode: this.term
            }
        });

        // extract the body of the details panel
        const body: string = request.body;
        const res: boolean = !!(body.match(/Class Number: (\d+)/));

        handler(res, this.timeSinceStart());
        return [res];
    }

}