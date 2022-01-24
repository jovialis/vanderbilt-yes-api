/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {Scraper, StreamedResponseHandler} from "./utils/scraper.js";
import got from "got";
import {load} from "cheerio";
import {Subject} from "../types/subject.type.js";

export class SubjectScraper extends Scraper<Subject> {

    override async scrape(handler: StreamedResponseHandler<Subject>): Promise<Subject[]> {
        this.startTime();

        const url = 'https://registrar.vanderbilt.edu/faculty-staff/course-renumbering/course-renumbering-toc.php';
        const response = await got(url);

        // Parse into cheerio
        const $ = load(response.body);

        // Grab the table
        const subjects: Subject[] = $('#subjects').find('tr').map(function(index, element) {
            if (index === 0) {
                return;
            }

            let subject: Subject = {
                id: "",
                name: ""
            };

            $(this).find('td').each(function(index, element) {
                const val = $(this).text();

                switch (index) {
                    case 0:
                        subject.id = val;
                        break;
                    case 3:
                        subject.name = val;
                        break;
                    default:
                        break;
                }
            });

            return subject;
        }).get();

        // Trigger handler for each discovered subject
        for (const subject of subjects) {
            await handler(subject, this.timeSinceStart());
        }

        return subjects;
    }

}