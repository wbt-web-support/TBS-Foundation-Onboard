export const predefinedQA: Record<string, string> = {
  "information before starting": `
    <p>Before we begin, we will need the following key details about your business:</p>

    <p><strong>Basic Company Information:</strong></p>
    <ul>
      <li>Company Name</li>
      <li>Company Type</li>
      <li>Registration Number</li>
      <li>Contact Details</li>
      <li>Address</li>
      <li>Founding Year</li>
      <li>Team Size</li>
      <li>Number of Vans</li>
      <li>Colleagues or Partners Involved in the Project</li>
    </ul>

    <p><strong>Business Offerings:</strong></p>
    <ul>
      <li>Availability of 24/7 Emergency Services</li>
      <li>Finance Options <em>(if applicable)</em></li>
      <li>Operating Region <em>(local or national)</em></li>
      <li>Unique Selling Points</li>
      <li>Brands and Certifications</li>
      <li>Main Services to Highlight</li>
      <li>Special Offers</li>
      <li>Preferences for Fonts, Colours, and Website Features</li>
    </ul>

    <p><strong>Digital Presence:</strong></p>
    <ul>
      <li>Competitor Website URLs</li>
      <li>Social Media Accounts</li>
      <li>Customer Reviews</li>
      <li>Email Address to Display on Your Site</li>
      <li>Current Website URL <em>(if applicable)</em></li>
    </ul>

    <p><strong>Customer Insights:</strong></p>
    <ul>
      <li>Typical Age and Lifetime Value of Customers</li>
      <li>Important Keywords for Google Rankings</li>
      <li>Lead-to-Sale Conversion Rate</li>
      <li>Desired Weekly Leads</li>
      <li>Accepted Payment Methods</li>
    </ul>
  `,

  greetings: "Hello! I'm the We Build Trades onboarding assistant. How can I help you today?",

  "stripe access": `
    <h3>Granting Stripe Access for Website Payment Integration</h3>
    <p>To allow developer access for Stripe integration, follow these steps:</p>
    <ol>
      <li>Log in to your Stripe account</li>
      <li>Navigate to the Stripe Dashboard</li>
      <li>Go to Account Settings</li>
      <li>Find the Developers section</li>
      <li>Enable API access</li>
    </ol>
    <p>Watch our step-by-step video guide:</p>
    <div class="video-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin-top:8px;">
      <iframe
        style="position:absolute;top:0;left:0;width:100%;height:100%;"
        src="https://www.youtube.com/embed/399d7c1i6F4?si=GhemtO3SUCrEdGv6"
        title="How to provide Stripe access"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>
  `,

  "stop form": `
    <p><strong>No worries — your progress is saved automatically!</strong></p>
    <p>Every answer you enter is saved in real time, so if you stop, close the tab, or lose connection, nothing is lost.</p>
    <p>To make it easy to <strong>come back later</strong>:</p>
    <ul>
      <li>Click the <strong>"Save Progress"</strong> button (bottom-right of the screen) — we'll email you a personal resume link.</li>
      <li>Or simply use the same browser on the same device — your answers will still be there.</li>
    </ul>
    <p>When you return, you'll pick up <strong>exactly where you left off</strong>. There's no need to start over.</p>
  `,

  "stop filling": `
    <p><strong>No worries — your progress is saved automatically!</strong></p>
    <p>Every answer you enter is saved in real time, so if you stop, close the tab, or lose connection, nothing is lost.</p>
    <p>To make it easy to <strong>come back later</strong>:</p>
    <ul>
      <li>Click the <strong>"Save Progress"</strong> button (bottom-right of the screen) — we'll email you a personal resume link.</li>
      <li>Or simply use the same browser on the same device — your answers will still be there.</li>
    </ul>
    <p>When you return, you'll pick up <strong>exactly where you left off</strong>. There's no need to start over.</p>
  `,

  "leave form": `
    <p><strong>No worries — your progress is saved automatically!</strong></p>
    <p>Every answer you enter is saved in real time, so if you stop, close the tab, or lose connection, nothing is lost.</p>
    <p>To make it easy to <strong>come back later</strong>:</p>
    <ul>
      <li>Click the <strong>"Save Progress"</strong> button (bottom-right of the screen) — we'll email you a personal resume link.</li>
      <li>Or simply use the same browser on the same device — your answers will still be there.</li>
    </ul>
    <p>When you return, you'll pick up <strong>exactly where you left off</strong>. There's no need to start over.</p>
  `,

  "how long": `
    <p>This onboarding form typically takes <strong>30 to 60 minutes</strong> to complete.</p>
    <p>You can <strong>save your progress</strong> at any time and return later — your answers are automatically stored.</p>
  `,

  "save progress": `
    <p>You can save your progress at any time by clicking the <strong>"Save Progress"</strong> button at the bottom of any section.</p>
    <p>We'll email you a link so you can return to exactly where you left off.</p>
  `,

  "what is this form": `
    <p>This questionnaire is designed to capture key details about your business. We'll ask for information like your company name, Company type, registration number, contact details, address, founding year, team size, number of vans, and any colleagues or partners involved in the project.</p>
    <p>We'll also explore your business offerings — such as 24/7 emergency services, finance options, operating region (local or national), unique selling points, brands and certifications, main services to highlight, special offers, and preferences for fonts, colours, and website features.</p>
    <p>You'll have the chance to share URLs for competitor websites, your social media accounts, customer reviews, and the email address you'd like to display on your site and your current website url.</p>
    <p>Finally, we'll cover customer insights, like the typical age and lifetime value of your customers, important keywords for Google rankings, your lead-to-sale conversion rate, desired weekly leads, accepted payment methods, and access details for tools like Stripe and Google.</p>
  `,

  "facebook access": `
    Watch this video to learn how to give Facebook access:
    <br/><br/>
    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">
      <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" width="240" height="150"
        src="https://www.youtube.com/embed/JYW8v4dQ2Sw?si=tBJ6YfW9JlImEYno"
        title="Facebook Access Tutorial"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
  `,

  "google access": `
    <p>To grant Google Ads or Google Analytics access:</p>
    <ul>
      <li>Log in to your <strong>Google Ads</strong> or <strong>Google Analytics</strong> account.</li>
      <li>Go to <strong>Admin</strong> settings.</li>
      <li>Under <strong>Account Access Management</strong>, click the <strong>+</strong> button.</li>
      <li>Enter the email address provided and select <strong>Admin</strong> access.</li>
      <li>Click <strong>Send Invitation</strong>.</li>
    </ul>
  `,

  "what is usp": `
    <p>A <strong>USP (Unique Selling Proposition)</strong> is what makes your business stand out from competitors.</p>
    <p>Examples:</p>
    <ul>
      <li>"24/7 emergency call-out service"</li>
      <li>"10-year workmanship guarantee"</li>
      <li>"Fixed-price quotes with no hidden fees"</li>
    </ul>
    <p>Think about what your best customers say when they recommend you to a friend.</p>
  `,

  contact: `
    <p>Need to speak with someone from the We Build Trades team?</p>
    <ul>
      <li><strong>Website:</strong> <a href="https://webuildtrades.com" target="_blank">webuildtrades.com</a></li>
      <li><strong>Email:</strong> <a href="mailto:hello@webuildtrades.com">hello@webuildtrades.com</a></li>
    </ul>
  `,
};

export function findPredefinedAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, answer] of Object.entries(predefinedQA)) {
    const keywords = key.toLowerCase().split(/\s+/);
    if (keywords.every((word) => lower.includes(word))) {
      return answer;
    }
  }
  return null;
}
