import { ReportTitle } from "../ui/shared"

// Evaluator profile data - corresponds to signatures in signatures.tsx
type EvaluatorProfile = {
    name: string
    title: string
    bio: string[]
    isSenior: boolean
}

export const EVALUATOR_PROFILES: EvaluatorProfile[] = [
    {
        name: "Luguan Yan",
        title: "Director of Evaluation",
        isSenior: true,
        bio: [
            "Mr. Yan obtained his degree of Bachelor of Arts in Philosophy from Nanjing University, the People's Republic of China in 1991 and the degree of Master of Arts in Philosophy from the University of Miami in 1998.",
            "He worked over 10 years in a prominent evaluation institution as a senior associate director and team leader for Asian-pacific countries. He has completed over 10000 foreign credential evaluations of documents from numerous foreign countries for various universities, licensing boards, U.S. government, and immigration services.",
            "He is a leading expert in the evaluation of credentials from the People's Republic of China and was invited several times to be a keynote speaker to hundreds of admission counselors of U.S. universities for evaluating complex credentials from the People's Republic of China."
        ]
    },
    {
        name: "Hongjian Chen",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Mr. Chen obtained his degree of Bachelor of Science in Vehicle Engineering from Shandong Jianzhu University, China in 2014 and the degree of Master of Science in Mechanical Engineering from the University of South Florida in 2018.",
            "He has worked as an Evaluator at American Education & Translation Services since January 2019. In this role, he evaluates international transcripts and diplomas regarding mechanical engineering and other technical fields, drafts credential reports for education and immigration purposes."
        ]
    },
    {
        name: "Beatriz Y. Pineda Gayon",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Ms. Pineda Gayon obtained her degree of Bachelor of Science in Psychology from the University of the Andes, Colombia in 1985.",
            "She has over 20 years of experience in the field of foreign credential evaluation. She worked as a Senior Evaluator at a prominent international education consultancy, Josef Silny & Associates, from 2001 to 2023, where she succeeded in initial training of evaluators and research of foreign education. She currently serves as an Evaluator for American Education & Translation Services, ensuring accurate credential equivalency assessments according to company standards.",
            "She specializes in the evaluation of credentials from Latin America and Spain, with a specific focus on Spanish-language documents. She has demonstrated expertise in revising evaluation methods to maximize accuracy and has drafted process documentation to standardize bilingual workflows."
        ]
    },
    {
        name: "Zhihua Zhao",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Mr. Zhao obtained his degree of Bachelor of Engineering in Electronics and Mechanics from the University of Electronic Science and Technology of China in 1993. He holds multiple master's degrees, including a Master of Science in Money and Banking from Southwestern University of Finance and Economics (1998), a Master of Science in Finance from Clark University (2003), and a Master of Science in Accounting from Boston College (2008).",
            "He has worked since 2010 at American Education and Translation Services Inc. as a VP and Senior Consultant. He has evaluated and translated thousands of foreign educational credential documents from various countries and regions.",
            "Mr. Zhao currently focuses on foreign credential research and evaluation regarding credentials from China and other Asian countries. He also provides international educational consulting services to graduate, undergraduate, and secondary school applicants in the USA and other countries."
        ]
    },
    {
        name: "Tong Liu",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Mr. Liu obtained his degree of Bachelor of Arts in Economics and Classics from Denison University in 2014 and the degree of Master of Arts in Classical Literature from Boston University in 2016.",
            "He has served as a Technical Translator and Evaluator at American Education and Translation Services since August 2016. In this role, he performs credential evaluations, drafts and edits evaluation reports, and verifies academic records, while also assisting in translation management.",
            "Mr. Liu is a linguist specialized in translation and cross-cultural communication with a broad background in global economy and languages. He focuses on evaluation cases involving Romance languages and possesses proficiency in multiple languages, including Mandarin, English, German, French, Modern Greek, Ancient Greek, Latin, and Classical Chinese."
        ]
    },
    {
        name: "Peiheng Li",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Mr. Li obtained his degree of Bachelor of Arts in Communication from South China Normal University, China in 2014 and the degree of Master of Science in Media Communication Studies from Florida State University in 2017.",
            "He served as an Evaluator at American Education & Translation Services from 2019 to 2021. In this capacity, he conducted evaluations of foreign academic credentials, drafted equivalency reports, and ensured all documentation adhered to established evaluation methodologies.",
            "Mr. Li specializes in the verification of accreditation and academic records for foreign credential evaluation. Leveraging his linguistic proficiency, he is capable of processing credentials involving Mandarin and Cantonese."
        ]
    },
    {
        name: "Yue Qi",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Ms. Qi obtained her degree of Bachelor of Agriculture from Beijing Forestry University, China in 2010 and the degree of Master of Science in Finance from Florida International University in 2014.",
            "She has worked as a Translator and Evaluator at American Education and Translation Services since September 2015. In this capacity, she conducts evaluations of foreign academic credentials under the supervision of senior staff, ensuring adherence to established methodologies, and prepares draft equivalency reports for final review.",
            "Ms. Qi specializes in the verification of institutional accreditation and the authenticity of academic records. Leveraging her native proficiency in Chinese and her academic background in Finance, she focuses on the evaluation of credentials from China and the analysis of financial documents."
        ]
    },
    {
        name: "Jianjun Zhao",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Mr. Zhao obtained his degree of Bachelor of Arts in Korean Language from Heilongjiang University, China in 2010. Additionally, he completed an exchange program majoring in Korean Language at Beakseok University, South Korea in 2008.",
            "He has worked as an Evaluator and Translator at American Education and Translation since January 2020. In this role, he evaluates international transcripts and diplomas under the guidance of senior evaluators and drafts credential reports for education, immigration, and licensing purposes.",
            "Mr. Zhao specializes in the translation and evaluation of educational documents involving the Korean and Chinese languages. Leveraging his proficiency in Mandarin, Korean, and English, he focuses on analyzing foreign educational credentials—such as academic transcripts, degrees, and professional certificates—to determine their U.S. equivalents."
        ]
    },
    {
        name: "Yang Song",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Ms. Song obtained her degree of Bachelor of International Economy and Trade from Beijing University of Posts and Telecommunications, China in 2012 and the degree of Master of Public Administration from the University of Miami in 2014.",
            "She has served as an Evaluator at American Education and Translation Service since February 2014. In this role, she provides professional credential evaluation services for immigration, education, and employment purposes, specializing in the assessment of degree certificates and graduation diplomas.",
            "Ms. Song is an expert in the translation and evaluation of academic credentials between English and Chinese. Leveraging her extensive experience in the field since 2014 and her native proficiency in Mandarin, she ensures accurate equivalency determinations for diverse foreign educational documents."
        ]
    },
    {
        name: "Julie Zhu Marchandise",
        title: "Evaluator",
        isSenior: false,
        bio: [
            "Ms. Marchandise obtained her degree of Bachelor of Arts in English Language and Literature from Hubei University, China in 1998. She also holds a Master of Business Administration from the Helsinki School of Economics (2002) and a Master of Luxury Management from the Polimoda Institute of Fashion and Marketing, Italy (2009).",
            "She has served as a Translator and Evaluator at American Education and Translation Services since July 2021. In this role, she is responsible for the translation and evaluation of international academic transcripts and diplomas to determine their equivalency within the U.S. educational system.",
            "Ms. Marchandise is a multilingual specialist with expert proficiency in Mandarin Chinese and English, as well as intermediate proficiency in French. She focuses on the analysis and evaluation of educational credentials from China and other international systems, ensuring accurate interpretations for academic and professional purposes."
        ]
    }
]

// Office locations data - West and East Coast HQs
const OFFICE_LOCATIONS = [
    { name: "Los Angeles (CA HQ)", address: "17802 Sky Park Cir, Suite 205 A, IRVINE, CA 92614-6403, United States", phone: "+1 949-954-7996", email: "ca2@aet21.com" },
    { name: "Miami (HQ)", address: "15321 S Dixie Hwy, #302, Palmetto Bay, FL 33157", phone: "+1 786-250-3999", email: "info@aet21.com" },
]

// Evaluator Profiles component - displays all evaluator introductions
const EvaluatorProfiles = ({ evaluatorName, seniorEvaluatorName }: { evaluatorName: string, seniorEvaluatorName: string }) => {
    // Filter profiles based on signatures
    // Find Senior Evaluator profile
    const seniorProfile = EVALUATOR_PROFILES.find(p => p.name === seniorEvaluatorName && p.isSenior);
    // Find Evaluator profile
    const evaluatorProfile = EVALUATOR_PROFILES.find(p => p.name === evaluatorName && !p.isSenior);

    // If no profiles found matching the names, fallback to showing all or handle gracefully
    // For now, let's just show the matched ones.
    const profiles = [];
    if (seniorProfile) profiles.push(seniorProfile);
    if (evaluatorProfile) profiles.push(evaluatorProfile);

    // Initial fallback if names don't match (e.g. during development or if names are empty)
    // You might want to remove this in strict production if names are guaranteed
    if (profiles.length === 0) {
        // Optional: fallback logic or empty state
    }

    return (
        <div className="mt-6">
            <ReportTitle>
                Evaluator Profiles
            </ReportTitle>
            <div className="flex flex-col gap-6 mt-4">
                {profiles.map((profile, index) => (
                    <div key={index}>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-blue-900">
                                {profile.name}, {profile.title}
                            </h3>
                            {profile.isSenior && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Senior
                                </span>
                            )}
                        </div>
                        {profile.bio.map((paragraph, pIndex) => (
                            <p key={pIndex} className="text-justify mb-2 text-xs">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

type AboutAetPageProps = {
    evaluatorName?: string
    seniorEvaluatorName?: string
}

export const AboutAetPage = ({ evaluatorName = "Hongjian Chen", seniorEvaluatorName = "Luguan Yan" }: AboutAetPageProps) => (
    <div className="mt-8 text-xs leading-relaxed font-sans">
        <ReportTitle>
            About AET
        </ReportTitle>

        {/* Company Profile - Full Width */}
        <div className="mb-4">
            {/* <h3 className="font-bold text-blue-900 mb-2 underline decoration-blue-900/30">Company Profile</h3> */}
            <p className="mb-2 text-justify">
                Founded in 2009 in Miami, FL, American Education & Translation Services (AET) has established itself as a premier provider of translation and credential evaluation services. AET is a Corporate Member of the American Translators Association (ATA) and a member of the Association of International Educators (NAFSA). Our evaluation services are accepted by the US Federal Government (such as USCIS, FDA, etc), most state governments, some licensing boards, and numerous U.S. institutions of higher education.
            </p>
            <p className="text-justify">
                We provide certified translation services in over 100 languages and have served thousands of clients including universities, licensing boards, and government agencies. We offer convenient online services and have multiple office locations to serve our clients.
            </p>
        </div>

        {/* Contact Information - Horizontal Grid Layout */}
        {/* <div className="mb-4">
            {/* <h3 className="font-bold text-blue-900 mb-2 underline decoration-blue-900/30">Contact Information</h3> */}
        {/* <div className="grid grid-cols-2 gap-6">
                {OFFICE_LOCATIONS.map((office, index) => (
                    <div key={index} className="text-xs">
                        <div className="font-bold text-gray-800">{office.name}</div>
                        <div className="text-gray-600 leading-tight">{office.address}</div>
                        <div className="text-gray-600 leading-tight">{office.phone}</div>
                        <div className="text-gray-600 leading-tight">{office.email}</div>
                    </div>
                ))}
            </div>
        </div> */}

        <EvaluatorProfiles evaluatorName={evaluatorName} seniorEvaluatorName={seniorEvaluatorName} />
    </div>
)
