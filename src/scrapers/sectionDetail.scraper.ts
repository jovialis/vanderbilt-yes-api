/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import got from "got";
import {load} from "cheerio";
import {CookieJar} from "tough-cookie";
import {Section, SectionDetails, SectionDetailsCapacity} from "../types/section.type.js";

export class SectionDetailScraper extends Scraper<SectionDetails> {

    private section: Section;

    constructor(section: Section, cookieJar?: CookieJar, startTime?: number) {
        super(cookieJar, startTime);
        this.section = section;
    }

    override async scrape(handler: StreamedResponseHandler<SectionDetails> = (_) => {
    }): Promise<SectionDetails[]> {
        this.markStart();

        const url = 'https://acad.app.vanderbilt.edu/more/GetClassSectionDetail.action';
        const request = await got(url, {
            cookieJar: this.cookieJar,
            searchParams: {
                classNumber: this.section.id,
                termCode: this.section.term
            }
        });

        // extract the body of the details panel
        const body = request.body;

        const details: SectionDetails = this.extractDetailsFromBody(body);
        await handler(details, this.timeSinceStart());

        return [details];
    }

    private extractDetailsFromBody(body: string): SectionDetails {
        const scraperThis: SectionDetailScraper = this;

        const $ = load(body);

        // Fetch description and notes
        let notes: string = null;
        let description: string = null;
        let school: string = null;
        let attributes: string[] = [];
        let capacity: SectionDetailsCapacity = null;
        let requirements: string = null;
        let bookURL: string = null;

        $('#mainSection').children().each(function (index, element) {
            // Flag that the next node will be a description or notes field
            if ($(this).attr('class') === 'detailHeader') {
                const title = $(this).text().trim();
                if (title === 'Description') {
                    description = $(this).next().text().trim();
                } else if (title === 'Notes') {
                    notes = $(this).next().text().trim();
                } else if (title === 'Details') {
                    school = scraperThis.extractSchoolFromDetailsPanel($, $(this).next());
                    requirements = scraperThis.extractRequirementsFromDetailsPanel($, $(this).next());
                }
            }
        });

        // Grab the attributes
        $('#rightSection').children().each(function (index, element) {
            // Flag that the next node will be a description or notes field
            if ($(this).attr('class') === 'detailHeader') {
                const title = $(this).text().trim();
                if (title === 'Attributes') {
                    attributes = scraperThis.extractAttributesFromDetailsPanel($, $(this).next());
                } else if (title === 'Availability') {
                    capacity = scraperThis.extractAvailability($, $(this).next());
                }
            }
        });

        bookURL = scraperThis.extractBookFromBody(body);

        return {
            school: school,
            description: description,
            notes: notes,
            attributes: attributes,
            availability: capacity,
            requirements: requirements,
            bookURL: bookURL
        };
    }

    private extractSchoolFromDetailsPanel($, panelNode): string {
        let school: string = null;

        $(panelNode).find('td.label').each(function (index, e) {
            const header = $(this).text().trim();
            if (header === 'School:') {
                school = $(this).next().text().trim();
            }
        });

        return school;
    }

    private extractRequirementsFromDetailsPanel($, panelNode): string {
        let requirements: string = null;

        $(panelNode).find('td.label').each(function (index, e) {
            const header = $(this).text().trim();
            if (header === 'Requirement(s):') {
                requirements = $(this).next().text().trim();
            }
        });

        return requirements;
    }

    private extractBookFromBody(body): string {
        let bookURL: string = null;

        // Extract the BOOK URL from the page's javascript
        body.replace(/'(.+)', 'BookLook'/g, (match, v) => {
            bookURL = v;
        });

        return bookURL;
    }

    private extractAttributesFromDetailsPanel($, panelNode): string[] {
        return $(panelNode).children('.listItem').map(function (index, e) {
            return $(this).text().trim();
        }).get();
    }

    private extractAvailability($, panelNode): SectionDetailsCapacity {
        let availability: SectionDetailsCapacity = {
            seats: -1,
            enrolled: -1,
            waitlistSeats: -1,
            waitlistEnrolled: -1
        };

        $(panelNode).find('.availabilityNameValueTable').first().find('td.label').each(function (index, e) {
            const label = $(this).text().trim();
            const value = Number($(this).next().text().trim());

            switch (label) {
                case 'Class Capacity:':
                    availability.seats = value;
                    break;
                case 'Total Enrolled:':
                    availability.enrolled = value;
                    break;
                case 'Wait List Capacity:':
                    availability.waitlistSeats = value;
                    break;
                case 'Total on Wait List:':
                    availability.waitlistEnrolled = value;
                    break;
            }
        });

        return availability;
    }

}