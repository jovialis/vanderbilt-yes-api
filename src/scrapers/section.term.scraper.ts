/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import {CookieJar} from "tough-cookie";
import {Section} from "../types/section.type.js";
import {TermID} from "../types/term.type.js";
import {SectionQueryScraper} from "./section.query.scraper.js";

export class SectionTermScraper extends Scraper<Section> {

    private readonly term: TermID;
    private readonly BLACKLISTED_CODES = [
        '3850', '3851', '3852', // Independent reading/study
        '7999', // Master's Thesis Research
        '8999', // Non candidate research
        '9999' // Ph.D dissertation research
    ];

    private searchedTerms: string[] = [];

    private discoveredSections: Section[] = [];

    private fetchDetails: boolean;

    constructor(term: TermID, fetchDetails: boolean = false, cookieJar?: CookieJar, startTime?: number) {
        super(cookieJar, startTime);
        this.fetchDetails = fetchDetails;
        this.term = term;
    }

    override async scrape(handler: StreamedResponseHandler<Section> = () => {}): Promise<Section[]> {
        this.markStart();

        this.searchedTerms = [];
        this.discoveredSections = [];

        // Trigger the recursive call.
        await this.searchByBracketedIncreases('', handler);

        return this.discoveredSections;
    }

    // Searches from 0[base] --> 9[base] then [base]0 --> [base]9
    // if there are 300 results or more, we recurse!
    private async searchByBracketedIncreases(base: string, handler: StreamedResponseHandler<Section>): Promise<void> {
        for (let i = 0; i < 10; i++) {
            let searchA = `${i}${base}`;
            let searchB = `${base}${i}`;

            if (!this.BLACKLISTED_CODES.includes(searchA) && !this.searchedTerms.includes(searchA)) {
                this.searchedTerms.push(searchA);

                const scraper = new SectionQueryScraper(searchA, this.term, this.fetchDetails, null, this.startTime());
                const sections: Section[] = await scraper.scrape(handler);

                this.discoverSections(sections);

                if (sections.length >= 300) {
                    await this.searchByBracketedIncreases(searchA, handler);
                }
            }

            if (!this.BLACKLISTED_CODES.includes(searchB) && !this.searchedTerms.includes(searchB)) {
                this.searchedTerms.push(searchB);

                const scraper = new SectionQueryScraper(searchB, this.term, this.fetchDetails, null, this.startTime());
                const sections: Section[] = await scraper.scrape(handler);

                this.discoverSections(sections);

                if (sections.length >= 300) {
                    await this.searchByBracketedIncreases(searchA, handler);
                }
            }
        }
    }

    private discoverSections(sections: Section[]) {
        const existingIDs = this.discoveredSections.map(s => s.id);

        const toAdd = sections.filter(s => !existingIDs.includes(s.id));
        this.discoveredSections.push(...toAdd);
    }

}