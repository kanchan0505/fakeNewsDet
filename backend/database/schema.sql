-- ============================================
-- Fake News Detection - PostgreSQL Schema
-- ============================================

-- Database creation (run separately if needed)
-- CREATE DATABASE fake_news_detection;

-- Predictions history table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    input_text TEXT NOT NULL,
    label VARCHAR(10) NOT NULL CHECK (label IN ('fake', 'real')),
    confidence FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Demo news articles table
CREATE TABLE IF NOT EXISTS demo_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed demo articles
INSERT INTO demo_articles (title, content) VALUES
('NASA Confirms Water on Mars Surface', 'NASA scientists have confirmed the presence of liquid water flowing on the surface of Mars during warm months. The discovery was made using data from the Mars Reconnaissance Orbiter, which detected hydrated salts on slopes where mysterious streaks have been observed. This finding significantly boosts the chances of finding microbial life on the Red Planet and has implications for future manned missions to Mars.'),
('Local Community Raises $50,000 for Children''s Hospital', 'A small town in Ohio has come together to raise over $50,000 for the local children''s hospital through a series of charity events including bake sales, fun runs, and community dinners. The funds will be used to purchase new medical equipment for the pediatric ward. Hospital administrators expressed their gratitude to the community for their overwhelming support.'),
('BREAKING: Scientists Discover New Species in Amazon Rainforest', 'A team of international researchers has discovered a previously unknown species of tree frog in the Amazon rainforest. The bright blue frog, tentatively named Dendrobates azureus nova, was found during a biodiversity survey in a remote region of Brazil. The discovery highlights the importance of continued conservation efforts in the Amazon.'),
('SHOCKING: Government Hiding Alien Technology in Secret Underground Base', 'According to unnamed sources who claim to have worked at a classified facility, the government has been hiding advanced alien technology recovered from multiple UFO crash sites over the past 70 years. These sources allege that reverse-engineered alien craft are being tested at a secret underground base in Nevada, and that free energy technology derived from these craft could solve the world energy crisis overnight but is being suppressed by powerful oil companies.'),
('New Study Links Coffee Consumption to Longer Lifespan', 'A comprehensive study published in the New England Journal of Medicine involving over 400,000 participants has found that moderate coffee consumption is associated with a lower risk of death from various causes. Researchers found that drinking three to five cups of coffee per day was linked to a 15 percent reduction in mortality risk. The study controlled for smoking, diet, and exercise habits.'),
('EXPOSED: Celebrity Secretly Controls Weather Using Mind Powers', 'Multiple witnesses have come forward claiming that a famous Hollywood celebrity has been secretly controlling the weather using telekinetic abilities developed through a secret government program. Anonymous insiders say the celebrity has caused several hurricanes and droughts to manipulate real estate prices and stock markets. The mainstream media has been paid billions to cover up this bombshell story that the elites dont want you to know about.'),
('Global Renewable Energy Investment Reaches Record High', 'Global investment in renewable energy reached a record $500 billion in 2025, according to a new report from the International Energy Agency. Solar and wind power accounted for the majority of new electricity generation capacity added worldwide. The report noted that declining costs of renewable technologies and supportive government policies have been key drivers of this growth.'),
('MIRACLE CURE: Doctors Dont Want You to Know About This Simple Kitchen Ingredient', 'Big Pharma is terrified because a simple kitchen ingredient has been proven to cure cancer diabetes heart disease and aging itself. Exposed doctors have been hiding this miracle cure from the public for decades to protect their profits. Simply mix two tablespoons of this common spice with warm water and drink it every morning to completely eliminate all diseases from your body within just three days. Share this before it gets deleted!'),
('SpaceX Successfully Launches Satellite Constellation', 'SpaceX has successfully deployed another batch of 60 Starlink satellites into low Earth orbit as part of its ongoing mission to provide global broadband internet coverage. The Falcon 9 rocket launched from Cape Canaveral and the first stage successfully landed on a drone ship in the Atlantic Ocean, marking the companys 200th successful booster landing.'),
('LEAKED: Secret Plan to Replace All Jobs with Robots by Next Year', 'A leaked document allegedly from a shadowy group of billionaires reveals a secret plan to replace every single human job with robots by the end of next year. The document claims that world leaders have already agreed to this plan and are building secret robot factories underground. Anyone who speaks out against this plan is being silenced by the deep state. Wake up people this is really happening and no mainstream media outlet will report on it!');

-- Index for faster queries
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX idx_predictions_label ON predictions(label);
