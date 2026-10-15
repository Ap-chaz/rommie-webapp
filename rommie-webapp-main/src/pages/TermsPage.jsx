import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { LegalPage } from "@/components/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/site";
const desc = "The rules for using Rommie as a student or a caretaker.";
const PAGE_META = [
            { title: "Terms of Use · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "Terms of Use · Rommie" },
            { property: "og:description", content: desc },
        ];
// NOTE: plain-language draft. Have a Kenyan lawyer review it before launch.
export default function Terms() {
    usePageMeta(PAGE_META);
    return (<LegalPage title="Terms of Use" intro="By using Rommie you agree to these terms. They are written to be read, so please do." sections={[
            {
                heading: "What Rommie is",
                body: <p>Rommie is a listing service. Caretakers and landlords post rooms, and students find them and make contact directly. Rommie is not a party to any agreement between a student and a caretaker, and does not own, manage or inspect the rooms listed.</p>,
            },
            {
                heading: "Your account",
                body: (<ul>
              <li>Give accurate details and keep your password and one-time codes private.</li>
              <li>You are responsible for what happens under your account.</li>
              <li>We may suspend accounts that break these terms.</li>
            </ul>),
            },
            {
                heading: "For caretakers and landlords",
                body: (<ul>
              <li>Only post rooms you are allowed to let, with true photos, rent and details.</li>
              <li>Mark a room Taken as soon as it is let, and reconfirm vacant rooms when asked. Listings that are not confirmed for 14 days are labelled "Needs reconfirming".</li>
              <li>Do not ask students for money just to view a room.</li>
              <li>You confirm you have the right to use the photos you upload.</li>
            </ul>),
            },
            {
                heading: "For students",
                body: (<ul>
              <li>Never pay before viewing the room. Visit with a friend and confirm the caretaker's identity.</li>
              <li>Use contact details only to ask about rooms, not for anything else.</li>
              <li>Documents you upload for verification must be your own.</li>
            </ul>),
            },
            {
                heading: "What is not allowed",
                body: (<ul>
              <li>Fake, misleading or already-taken listings.</li>
              <li>Harassment, discrimination or illegal activity.</li>
              <li>Scraping, or trying to break or overload the service.</li>
            </ul>),
            },
            {
                heading: "Verification and trust scores",
                body: <p>A Verified badge means our team reviewed an identity document. It does not mean we inspected the room or can promise how a caretaker will behave. Trust scores are a guide, not a guarantee. See <Link to="/how-verification-works" className="underline">how verification works</Link>.</p>,
            },
            {
                heading: "Reports and removal",
                body: <p>Anyone can report a listing. We may hide or remove listings and accounts that look fake, stale or unsafe, with or without notice.</p>,
            },
            {
                heading: "Our responsibility",
                body: <p>We work to keep Rommie accurate and available, but we provide it as is. To the extent the law allows, Rommie is not liable for losses from dealings between students and caretakers, including any rent or deposit you agree between yourselves. Nothing here limits rights you have under Kenyan consumer law.</p>,
            },
            {
                heading: "Changes and contact",
                body: <p>We may update these terms and will change the date above when we do. Continued use means you accept the new version. Governed by the laws of Kenya. Questions: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See also our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>,
            },
        ]}/>);
}
