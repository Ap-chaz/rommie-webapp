import { usePageMeta } from "@/lib/usePageMeta";
import { Link } from "@/lib/router";
import { LegalPage } from "@/components/LegalPage";
import { useSiteSettings } from "@/lib/settings";
const desc = "How Rommie collects, uses and protects your personal information.";
const PAGE_META = [
            { title: "Privacy Policy · Rommie" },
            { name: "description", content: desc },
            { property: "og:title", content: "Privacy Policy · Rommie" },
            { property: "og:description", content: desc },
        ];
// NOTE: plain-language draft. Have a Kenyan lawyer review it before launch.
export default function Privacy() {
    usePageMeta(PAGE_META);
    const contact = useSiteSettings();
    return (<LegalPage title="Privacy Policy" intro="Rommie helps university students in Kenya find vacant rooms near campus and contact the caretaker directly. This page explains what we collect, why, and the choices you have." sections={[
            {
                heading: "What we collect",
                body: (<>
              <p>Depending on how you use Rommie, we collect:</p>
              <ul>
                <li><strong>Account details:</strong> your name, phone number and a password (stored securely, never in plain text).</li>
                <li><strong>Verification documents:</strong> a student ID, admission letter or national ID that you choose to upload.</li>
                <li><strong>Your activity:</strong> rooms you save, vacancy alerts you create and reports you submit.</li>
                <li><strong>Listing details (caretakers):</strong> room descriptions, photos, rent, location and the phone numbers you publish.</li>
                <li><strong>Basic technical data:</strong> device and browser type, so the site works properly.</li>
              </ul>
            </>),
            },
            {
                heading: "How we use it",
                body: (<ul>
              <li>To create and secure your account, including sending one-time codes by SMS.</li>
              <li>To send vacancy alerts you asked for, by SMS.</li>
              <li>To review verification requests and keep listings accurate and fresh.</li>
              <li>To look into reports of fake or wrong listings.</li>
              <li>To fix problems and improve Rommie.</li>
            </ul>),
            },
            {
                heading: "Who can see your information",
                body: (<>
              <p>A caretaker's name, trust score and the contact numbers they publish are shown on their listings. Students contact caretakers through WhatsApp or a phone call from their own device, so Rommie does not pass a student's phone number to a caretaker.</p>
              <p>Verification documents are seen only by Rommie's review team. They are never shown on your profile or in listings. We do not sell your personal information.</p>
            </>),
            },
            {
                heading: "How long we keep it",
                body: <p>We keep your information while your account is active and for as long as needed to keep the platform safe. You can ask us to delete your account and documents at any time.</p>,
            },
            {
                heading: "Your rights",
                body: (<>
              <p>Under the Data Protection Act, 2019 you can ask to see the information we hold about you, correct it, or have it deleted, and you can object to how it is used.</p>
              <p>To make a request, write to <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>.</p>
            </>),
            },
            {
                heading: "Security",
                body: <p>We use reasonable technical and organisational measures to protect your information. No system is perfectly secure, so please use a strong password and never share your one-time codes.</p>,
            },
            {
                heading: "Changes to this policy",
                body: <p>If we change this policy in a way that matters, we will update the date above and tell you in the app. Questions? Read our <Link to="/terms" className="underline">Terms</Link> or write to <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>.</p>,
            },
        ]}/>);
}
