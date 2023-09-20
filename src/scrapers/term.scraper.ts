/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import got from "got";
import {load} from "cheerio";
import {YES_BASE_URL} from "../config";
import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import {Term, TermID, TermSession} from "../types/term.type.js";

export class TermScraper extends Scraper<Term> {

    private readonly SEARCH_CLASSES = `${YES_BASE_URL}/SearchClasses!input.action`;

    override async scrape(handler: StreamedResponseHandler<Term> = (_) => {
    }): Promise<Term[]> {
        this.markStart();

        let terms: Term[] = await this.scrapeTerms();
        for (let term of terms) {
            term.sessions = await this.scrapeTermSessions(term.id);

            // Trigger the streamed response handler.
            await handler(term, this.timeSinceStart());
        }

        return terms;
    }

    /**
     * Fetches all of the Terms out of YES.
     * @private
     */
    private async scrapeTerms(): Promise<Term[]> {
        // request base search page. from there, extract all the available terms.
        const response = await got(this.SEARCH_CLASSES, {
            cookieJar: this.cookieJar
        });

        // Extract body
        const body = response.body;

        // parse into cheerio
        const $ = load(body);
        return $('#selectedTerm')
            .find('option')
            .map(function (index, element) {
                    return {
                        id: $(this).attr('value'),
                        title: $(this).text()
                    };
                }
            ).get();
    }

    /**
     * Fetches all of the Sessions associated with a given Term.
     * @param term
     * @private
     */
    private async scrapeTermSessions(term: TermID): Promise<TermSession[]> {
        // Update our cookie session term
        await got(`${this.SEARCH_CLASSES}?selectedTermCode=${term}`, {
            cookieJar: this.cookieJar
        });

        const updateSessions = `${YES_BASE_URL}/SelectTerm!updateSessions.action`;
        const sessionsResult = await got(updateSessions, {
            cookieJar: this.cookieJar,
            responseType: 'json'
        });

        const body = <{ code: string, longDescription: string, shortDescription: string }[]>sessionsResult.body;
        return body.map(t => {
            return {
                id: t.code,
                titleLong: t.longDescription,
                titleShort: t.shortDescription
            };
        });
    }

}