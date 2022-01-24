/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import got, {Response} from "got";
import {load} from "cheerio";
import {CookieJar} from "tough-cookie";
import {Section} from "../types/section.type.js";
import {TermID} from "../types/term.type.js";
import {SectionDetailScraper} from "./sectionDetail.scraper.js";

export class SectionQueryScraper extends Scraper<Section> {

    private readonly query: string;
    private readonly fetchDetails: boolean;
    private readonly term: TermID;

    constructor(query: string, term: TermID, fetchDetails: boolean = false, cookieJar?: CookieJar, startTime?: number) {
        super(cookieJar, startTime);
        this.query = query;
        this.fetchDetails = fetchDetails;
        this.term = term;
    }

    override async scrape(handler: StreamedResponseHandler<Section> = () => {}): Promise<Section[]> {
        this.markStart();

        // Set the current term to scrape
        const setTerm = `https://acad.app.vanderbilt.edu/more/SelectTerm!selectTerm.action?selectedTermCode=${this.term}`;
        await got(setTerm, {cookieJar: this.cookieJar})

        // Get objects from pagination
        return await this.paginateByQuery(this.query, this.term, handler);
    }

    private async paginateByQuery(query: string, term: TermID, handler: StreamedResponseHandler<Section>): Promise<Section[]> {
        // Prime the search for pagination
        const searchUrl = "https://acad.app.vanderbilt.edu/more/SearchClassesExecute!search.action";
        const searchResponse = await got(searchUrl, {
            searchParams: {
                keywords: query
            },
            cookieJar: this.cookieJar
        });

        // No need to do further operations if no classes found.
        if (searchResponse.body.toLowerCase().includes('no classes found')) {
            return [];
        }

        // Get number of results and results per page. feed this into pagination.
        let numResults: number;
        let rowsPerPage: number;

        if (searchResponse.body.includes('totalRecords')) {
            numResults = Number.parseInt(searchResponse.body.match(/totalRecords: (\d+)/)[1]);
            rowsPerPage = Number.parseInt(searchResponse.body.match(/rowsPerPage : (\d+)/)[1]);
        }

        let numPages: number = Math.ceil(numResults / rowsPerPage) || 1;

        console.log('Num results ' + numResults);
        console.log('Rows per page: ' + rowsPerPage);

        // Completed array of tokens. Each one represents a section.
        let sectionTokens: Section[] = [];

        // Don't do pagination if there's only one page
        if (numPages === 1) {
            console.log("Performing single page digest")
            sectionTokens.push(...(await this.extractSectionsFromBody(searchResponse.body, term, handler)));
        } else {
            console.log("Performing pagination")
            console.log(`Page 1/${numPages}`)

            const baseUrl = "https://acad.app.vanderbilt.edu/more/SearchClassesExecute!switchPage.action?pageNum=";
            let curPage = 1;

            sectionTokens.push(...await got.paginate.all(
                `${baseUrl}${curPage}`,
                {
                    cookieJar: this.cookieJar,
                    pagination: {
                        stackAllItems: false,
                        transform: async (response: Response<string>) => {
                            return await this.extractSectionsFromBody(response.body, term, handler);
                        },
                        paginate: ({response}) => {
                            curPage++;

                            // Either stop pagination or increase the page #
                            if (curPage > numPages) {
                                return false;
                            } else {
                                console.log(`Page ${curPage}/${numPages}`);
                                return {
                                    url: new URL(`${baseUrl}${curPage}`),
                                };
                            }
                        }
                    }
                }
            ));
        }

        console.log(`Discovered ${sectionTokens.length} sections for keyword \"${query}\" in term ${term}.`);
        return sectionTokens;
    }

    private async extractSectionsFromBody(body: string, term: TermID, handler: StreamedResponseHandler<Section>): Promise<Section[]> {
        const $ = load(body);

        let sectionTokens: Section[] = [];

        // Search for all classes on the page
        $(".classTable").each(function (index, e) {
            const element = $(this);

            // Extract header information for all sections under this sections.
            const abbreviation = element.find('.classAbbreviation').text();
            const title = element.find('.classDescription').text().trim();

            // Iterate over sections.
            element.find('.classRow').each(function (index, e) {
                const row = $(this);

                // Only create a token for allowed class types.
                const sectionType = row.children('.classType').text().trim();
                const classSectionNode = row.children('.classSection').first();
                const sectionId = classSectionNode.attr('id').split('_')[1].trim();
                const sectionNumber = classSectionNode.text().trim();
                let instructors = row.children('.classInstructor').text().trim().split('|').map(i => i.trim());
                const days = row.children('.classMeetingDays').html().trim().split('<br>');
                const times = row.children('.classMeetingTimes').html().trim().split('<br>').map(i => (i.split(' ').join('')));
                const hours = row.children('.classHours').text().trim();
                // const location = row.children('.classBuilding').text().trim();

                // Default no instructors to generic Staff.
                if (instructors.length === 0 || instructors[0] === '') {
                    instructors = ['staff'];
                }

                // Combine days and times
                let combinedSchedule = [];
                for (let i = 0; i < days.length - 1; i++) {
                    combinedSchedule.push(`${days[i]};${times[i].replace(' ', '')}`);
                }

                // Notify that we've found a new section.
                sectionTokens.push({
                    id: sectionId,
                    term: term,

                    course: {
                        abbreviation: abbreviation.slice(0, abbreviation.length - 1),
                        name: title
                    },

                    number: sectionNumber,
                    type: sectionType,
                    schedule: combinedSchedule.join(','),
                    instructors: instructors,

                    hours: Number.parseInt(hours)
                });
            });
        });

        // Trigger the handler
        for (let token of sectionTokens) {
            // Fetch details if needed
            if (this.fetchDetails) {
                const detailsScraper = new SectionDetailScraper(token, null, this.startTime());
                token.details = (await detailsScraper.scrape())[0];
            }

            await handler(token, this.timeSinceStart());
        }

        return sectionTokens;
    }

}