/**
 * Seed script for legal documents (Privacy Policy + Terms of Use)
 * Creates 4 languages × 2 types = 8 documents.
 *
 * Run with: bun run scripts/seed-legal.ts (or tsx scripts/seed-legal.ts)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import { LegalDocument } from '../lib/db/models/LegalDocument';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in environment');
    process.exit(1);
}

// ─── Privacy Policy ──────────────────────────────────────────────────────────

const PRIVACY_EN = `PRIVACY POLICY

Last updated: April 2026

1. INTRODUCTION

Al-Aqd ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our mobile application.

By using Al-Aqd, you agree to the collection and use of information in accordance with this policy.

2. INFORMATION WE COLLECT

We collect the following types of information:

- Personal identification: name, date of birth, gender, phone number, email address
- Profile information: photos, biography, ethnicity, nationality, marital status, education, profession
- Religious information: religious practice level, faith tags, mahram or guardian contact details
- Usage data: matches, messages, swipes, app activity
- Technical data: device type, operating system, IP address, language preferences

3. HOW WE USE YOUR INFORMATION

We use your information to:

- Create and manage your account
- Match you with compatible profiles based on Islamic values
- Enable communication between matched users
- Improve our services and personalize your experience
- Send you important notifications about your account
- Comply with legal obligations
- Prevent fraud and abuse

4. SHARING YOUR INFORMATION

We do not sell your personal data. We may share information with:

- Other users (only your profile information that you choose to display)
- Your designated mahram or guardian (only if you provide their contact details)
- Service providers who help us operate the app (under strict confidentiality)
- Law enforcement, when required by law

5. YOUR RIGHTS

You have the right to:

- Access the personal data we hold about you
- Request correction of inaccurate data
- Request deletion of your account and data
- Object to or restrict certain processing
- Receive your data in a portable format
- Withdraw consent at any time

To exercise these rights, contact us at privacy@al-aqd.com.

6. DATA RETENTION

We keep your personal data only as long as necessary to provide our services and comply with legal obligations. When you delete your account, we remove your personal data within 30 days, except where retention is legally required.

7. SECURITY

We implement reasonable technical and organizational measures to protect your data from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.

8. CHILDREN

Al-Aqd is intended for users aged 18 and over. We do not knowingly collect data from minors.

9. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or by email.

10. CONTACT US

If you have questions about this Privacy Policy, contact us at:
privacy@al-aqd.com`;

const PRIVACY_FR = `POLITIQUE DE CONFIDENTIALITÉ

Dernière mise à jour : avril 2026

1. INTRODUCTION

Al-Aqd (« nous », « notre ») s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et partageons vos informations personnelles lorsque vous utilisez notre application mobile.

En utilisant Al-Aqd, vous acceptez la collecte et l'utilisation des informations conformément à cette politique.

2. INFORMATIONS COLLECTÉES

Nous collectons les types d'informations suivants :

- Identification personnelle : nom, date de naissance, genre, numéro de téléphone, adresse e-mail
- Informations de profil : photos, biographie, origine, nationalité, situation matrimoniale, éducation, profession
- Informations religieuses : niveau de pratique religieuse, valeurs de foi, coordonnées du mahram ou du tuteur
- Données d'utilisation : correspondances, messages, swipes, activité dans l'application
- Données techniques : type d'appareil, système d'exploitation, adresse IP, préférences linguistiques

3. UTILISATION DE VOS INFORMATIONS

Nous utilisons vos informations pour :

- Créer et gérer votre compte
- Vous proposer des profils compatibles selon les valeurs islamiques
- Permettre la communication entre utilisateurs correspondants
- Améliorer nos services et personnaliser votre expérience
- Vous envoyer des notifications importantes concernant votre compte
- Respecter nos obligations légales
- Prévenir la fraude et les abus

4. PARTAGE DE VOS INFORMATIONS

Nous ne vendons pas vos données personnelles. Nous pouvons partager des informations avec :

- D'autres utilisateurs (uniquement les informations de profil que vous choisissez d'afficher)
- Votre mahram ou tuteur désigné (uniquement si vous fournissez ses coordonnées)
- Des prestataires de services qui nous aident à exploiter l'application (sous strict accord de confidentialité)
- Les autorités compétentes, lorsque la loi l'exige

5. VOS DROITS

Vous disposez des droits suivants :

- Accéder aux données personnelles que nous détenons sur vous
- Demander la correction de données inexactes
- Demander la suppression de votre compte et de vos données
- Vous opposer ou restreindre certains traitements
- Recevoir vos données dans un format portable
- Retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous à privacy@al-aqd.com.

6. CONSERVATION DES DONNÉES

Nous conservons vos données personnelles uniquement le temps nécessaire à la fourniture de nos services et au respect de nos obligations légales. Lorsque vous supprimez votre compte, nous supprimons vos données personnelles dans un délai de 30 jours, sauf obligation légale contraire.

7. SÉCURITÉ

Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données contre tout accès, modification ou divulgation non autorisés. Cependant, aucune méthode de transmission sur Internet n'est sûre à 100 %.

8. ENFANTS

Al-Aqd est destiné aux utilisateurs âgés de 18 ans et plus. Nous ne collectons pas sciemment de données auprès de mineurs.

9. MODIFICATIONS DE CETTE POLITIQUE

Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous informerons des modifications importantes via l'application ou par e-mail.

10. NOUS CONTACTER

Pour toute question concernant cette politique, contactez-nous à :
privacy@al-aqd.com`;

const PRIVACY_AR = `سياسة الخصوصية

آخر تحديث: أبريل 2026

1. مقدمة

تلتزم Al-Aqd ("نحن"، "خاصتنا") بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيف نقوم بجمع واستخدام وتخزين ومشاركة معلوماتك الشخصية عند استخدامك لتطبيقنا للهاتف المحمول.

باستخدامك لتطبيق Al-Aqd، فإنك توافق على جمع المعلومات واستخدامها وفقاً لهذه السياسة.

2. المعلومات التي نجمعها

نقوم بجمع الأنواع التالية من المعلومات:

- معلومات التعريف الشخصي: الاسم، تاريخ الميلاد، الجنس، رقم الهاتف، البريد الإلكتروني
- معلومات الملف الشخصي: الصور، السيرة الذاتية، الأصل، الجنسية، الحالة الاجتماعية، التعليم، المهنة
- المعلومات الدينية: مستوى الممارسة الدينية، قيم الإيمان، بيانات الاتصال بالمحرم أو الولي
- بيانات الاستخدام: المطابقات، الرسائل، السحب، النشاط في التطبيق
- البيانات التقنية: نوع الجهاز، نظام التشغيل، عنوان IP، تفضيلات اللغة

3. كيفية استخدام معلوماتك

نستخدم معلوماتك من أجل:

- إنشاء وإدارة حسابك
- اقتراح ملفات شخصية متوافقة وفقاً للقيم الإسلامية
- تمكين التواصل بين المستخدمين المتطابقين
- تحسين خدماتنا وتخصيص تجربتك
- إرسال إشعارات مهمة بشأن حسابك
- الامتثال للالتزامات القانونية
- منع الاحتيال وسوء الاستخدام

4. مشاركة معلوماتك

نحن لا نبيع بياناتك الشخصية. قد نشارك المعلومات مع:

- المستخدمين الآخرين (فقط معلومات الملف الشخصي التي تختار عرضها)
- المحرم أو الولي المعين (فقط إذا قدمت بيانات الاتصال الخاصة به)
- مزودي الخدمات الذين يساعدوننا في تشغيل التطبيق (تحت اتفاقيات سرية صارمة)
- السلطات المختصة عند الاقتضاء القانوني

5. حقوقك

لديك الحق في:

- الوصول إلى البيانات الشخصية التي نحتفظ بها عنك
- طلب تصحيح البيانات غير الدقيقة
- طلب حذف حسابك وبياناتك
- الاعتراض على معالجة معينة أو تقييدها
- استلام بياناتك بصيغة قابلة للنقل
- سحب موافقتك في أي وقت

لممارسة هذه الحقوق، تواصل معنا عبر privacy@al-aqd.com.

6. الاحتفاظ بالبيانات

نحتفظ ببياناتك الشخصية فقط طالما كان ذلك ضرورياً لتقديم خدماتنا والامتثال للالتزامات القانونية. عند حذف حسابك، نقوم بإزالة بياناتك الشخصية خلال 30 يوماً، ما لم يكن الاحتفاظ بها مطلوباً قانونياً.

7. الأمان

نطبق تدابير تقنية وتنظيمية معقولة لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفصاح. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%.

8. الأطفال

تطبيق Al-Aqd مخصص للمستخدمين الذين تبلغ أعمارهم 18 عاماً فما فوق. لا نقوم بجمع البيانات عن قصد من القاصرين.

9. التغييرات على هذه السياسة

قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات مهمة عبر التطبيق أو البريد الإلكتروني.

10. اتصل بنا

إذا كانت لديك أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر:
privacy@al-aqd.com`;

const PRIVACY_ES = `POLÍTICA DE PRIVACIDAD

Última actualización: abril de 2026

1. INTRODUCCIÓN

Al-Aqd ("nosotros", "nuestro") se compromete a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y compartimos su información personal cuando utiliza nuestra aplicación móvil.

Al utilizar Al-Aqd, usted acepta la recopilación y el uso de información de acuerdo con esta política.

2. INFORMACIÓN QUE RECOPILAMOS

Recopilamos los siguientes tipos de información:

- Identificación personal: nombre, fecha de nacimiento, género, número de teléfono, correo electrónico
- Información de perfil: fotos, biografía, origen, nacionalidad, estado civil, educación, profesión
- Información religiosa: nivel de práctica religiosa, valores de fe, datos de contacto del mahram o tutor
- Datos de uso: coincidencias, mensajes, swipes, actividad en la aplicación
- Datos técnicos: tipo de dispositivo, sistema operativo, dirección IP, preferencias de idioma

3. CÓMO USAMOS SU INFORMACIÓN

Utilizamos su información para:

- Crear y gestionar su cuenta
- Sugerirle perfiles compatibles según los valores islámicos
- Permitir la comunicación entre usuarios coincidentes
- Mejorar nuestros servicios y personalizar su experiencia
- Enviarle notificaciones importantes sobre su cuenta
- Cumplir con obligaciones legales
- Prevenir fraudes y abusos

4. COMPARTIR SU INFORMACIÓN

No vendemos sus datos personales. Podemos compartir información con:

- Otros usuarios (solo la información de perfil que usted decida mostrar)
- Su mahram o tutor designado (solo si proporciona sus datos de contacto)
- Proveedores de servicios que nos ayudan a operar la aplicación (bajo estrictos acuerdos de confidencialidad)
- Autoridades competentes, cuando la ley lo exija

5. SUS DERECHOS

Usted tiene derecho a:

- Acceder a los datos personales que tenemos sobre usted
- Solicitar la corrección de datos inexactos
- Solicitar la eliminación de su cuenta y datos
- Oponerse o restringir ciertos tratamientos
- Recibir sus datos en un formato portátil
- Retirar su consentimiento en cualquier momento

Para ejercer estos derechos, contáctenos en privacy@al-aqd.com.

6. RETENCIÓN DE DATOS

Conservamos sus datos personales solo durante el tiempo necesario para prestar nuestros servicios y cumplir con las obligaciones legales. Cuando elimina su cuenta, eliminamos sus datos personales en un plazo de 30 días, salvo cuando la ley exija su conservación.

7. SEGURIDAD

Implementamos medidas técnicas y organizativas razonables para proteger sus datos contra el acceso, alteración o divulgación no autorizados. Sin embargo, ningún método de transmisión por Internet es 100 % seguro.

8. NIÑOS

Al-Aqd está destinado a usuarios mayores de 18 años. No recopilamos a sabiendas datos de menores.

9. CAMBIOS EN ESTA POLÍTICA

Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio importante a través de la aplicación o por correo electrónico.

10. CONTÁCTENOS

Si tiene preguntas sobre esta Política de Privacidad, contáctenos en:
privacy@al-aqd.com`;

// ─── Terms of Use ────────────────────────────────────────────────────────────

const TERMS_EN = `TERMS OF USE

Last updated: April 2026

1. ACCEPTANCE OF TERMS

By creating an account and using Al-Aqd, you agree to be bound by these Terms of Use. If you do not agree, please do not use the application.

2. ELIGIBILITY

To use Al-Aqd, you must:

- Be at least 18 years old
- Have the legal capacity to enter into a binding agreement
- Not be prohibited from using the service under applicable law
- Provide accurate, complete, and up-to-date information

3. PURPOSE OF THE APP

Al-Aqd is a matrimonial application designed to help Muslims find compatible partners for marriage, in accordance with Islamic values. The platform is intended exclusively for serious marriage purposes.

4. ACCOUNT REGISTRATION

You are responsible for:

- Maintaining the confidentiality of your account credentials
- All activity that occurs under your account
- Notifying us immediately of any unauthorized use
- Providing only accurate and truthful information

5. USER CONDUCT

When using Al-Aqd, you agree NOT to:

- Use false identity or impersonate another person
- Post inappropriate, offensive, or illegal content
- Harass, threaten, or harm other users
- Spam or send commercial messages
- Use the app for any purpose other than serious marriage research
- Share your account with others
- Attempt to bypass our security measures or scrape data
- Use the app to promote any other service

6. CONTENT YOU PROVIDE

You retain ownership of the content you post on Al-Aqd. By posting content, you grant us a non-exclusive license to display it within the app to other users.

You are solely responsible for the content you publish. We reserve the right to remove any content that violates these terms.

7. MAHRAM AND GUARDIAN

In line with Islamic principles, female users are encouraged to designate a mahram or trusted guardian. We may notify them when communications begin, depending on your settings.

8. SUBSCRIPTIONS AND PAYMENTS

Al-Aqd offers free and premium features. Premium subscriptions are billed in advance and renew automatically unless cancelled. Refunds are subject to applicable consumer law.

9. ACCOUNT SUSPENSION AND TERMINATION

We reserve the right to suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or misuse the platform. You may delete your account at any time from the settings.

10. DISCLAIMERS

Al-Aqd is provided "as is". We do not guarantee that you will find a marriage partner. We do not perform criminal background checks on users. Always exercise caution when interacting with people you meet online.

11. LIMITATION OF LIABILITY

To the maximum extent permitted by law, Al-Aqd shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.

12. CHANGES TO THESE TERMS

We may update these Terms of Use. We will notify you of significant changes via the app. Continued use after changes constitutes acceptance.

13. GOVERNING LAW

These Terms are governed by the laws of Belgium. Any dispute shall be resolved through the courts of Brussels.

14. CONTACT

For questions about these Terms, contact us at:
support@al-aqd.com`;

const TERMS_FR = `CONDITIONS D'UTILISATION

Dernière mise à jour : avril 2026

1. ACCEPTATION DES CONDITIONS

En créant un compte et en utilisant Al-Aqd, vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.

2. ÉLIGIBILITÉ

Pour utiliser Al-Aqd, vous devez :

- Être âgé d'au moins 18 ans
- Avoir la capacité légale de conclure un accord contraignant
- Ne pas être interdit d'utilisation du service par la loi applicable
- Fournir des informations exactes, complètes et à jour

3. OBJECTIF DE L'APPLICATION

Al-Aqd est une application matrimoniale conçue pour aider les musulmans à trouver des partenaires compatibles en vue du mariage, conformément aux valeurs islamiques. La plateforme est destinée exclusivement à des fins matrimoniales sérieuses.

4. INSCRIPTION DU COMPTE

Vous êtes responsable de :

- Maintenir la confidentialité de vos identifiants
- Toute activité effectuée sous votre compte
- Nous notifier immédiatement de toute utilisation non autorisée
- Ne fournir que des informations exactes et véridiques

5. CONDUITE DE L'UTILISATEUR

En utilisant Al-Aqd, vous acceptez de NE PAS :

- Utiliser une fausse identité ou usurper l'identité d'une autre personne
- Publier du contenu inapproprié, offensant ou illégal
- Harceler, menacer ou nuire à d'autres utilisateurs
- Envoyer des spams ou des messages commerciaux
- Utiliser l'application à des fins autres que la recherche sérieuse de mariage
- Partager votre compte avec d'autres
- Tenter de contourner nos mesures de sécurité ou de récupérer des données
- Utiliser l'application pour promouvoir un autre service

6. CONTENU QUE VOUS FOURNISSEZ

Vous conservez la propriété du contenu que vous publiez sur Al-Aqd. En le publiant, vous nous accordez une licence non exclusive pour l'afficher dans l'application aux autres utilisateurs.

Vous êtes seul responsable du contenu publié. Nous nous réservons le droit de retirer tout contenu enfreignant ces conditions.

7. MAHRAM ET TUTEUR

Conformément aux principes islamiques, les utilisatrices sont encouragées à désigner un mahram ou un tuteur de confiance. Nous pouvons les notifier lorsque les communications commencent, selon vos paramètres.

8. ABONNEMENTS ET PAIEMENTS

Al-Aqd propose des fonctionnalités gratuites et premium. Les abonnements premium sont facturés à l'avance et se renouvellent automatiquement sauf annulation. Les remboursements sont soumis au droit de la consommation applicable.

9. SUSPENSION ET RÉSILIATION DU COMPTE

Nous nous réservons le droit de suspendre ou de résilier votre compte si vous enfreignez ces Conditions, commettez une fraude ou utilisez la plateforme à mauvais escient. Vous pouvez supprimer votre compte à tout moment depuis les paramètres.

10. AVERTISSEMENTS

Al-Aqd est fournie « telle quelle ». Nous ne garantissons pas que vous trouverez un partenaire de mariage. Nous n'effectuons pas de vérifications d'antécédents criminels. Soyez toujours prudent lors d'interactions avec des personnes rencontrées en ligne.

11. LIMITATION DE RESPONSABILITÉ

Dans toute la mesure permise par la loi, Al-Aqd ne saurait être tenu responsable de tout dommage indirect, accessoire ou consécutif découlant de votre utilisation de l'application.

12. MODIFICATIONS DE CES CONDITIONS

Nous pouvons mettre à jour ces Conditions d'Utilisation. Nous vous informerons des modifications importantes via l'application. L'utilisation continue après modifications constitue une acceptation.

13. DROIT APPLICABLE

Ces Conditions sont régies par le droit belge. Tout litige sera réglé devant les tribunaux de Bruxelles.

14. CONTACT

Pour toute question concernant ces Conditions, contactez-nous à :
support@al-aqd.com`;

const TERMS_AR = `شروط الاستخدام

آخر تحديث: أبريل 2026

1. قبول الشروط

بإنشائك حساباً واستخدامك لتطبيق Al-Aqd، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق، يرجى عدم استخدام التطبيق.

2. الأهلية

لاستخدام Al-Aqd، يجب عليك:

- أن يكون عمرك 18 عاماً على الأقل
- أن تتمتع بالأهلية القانونية لإبرام اتفاقية ملزمة
- ألا يكون منعك من استخدام الخدمة محظوراً بموجب القانون المعمول به
- تقديم معلومات دقيقة وكاملة ومحدثة

3. الغرض من التطبيق

Al-Aqd هو تطبيق للزواج صمم لمساعدة المسلمين على إيجاد شركاء متوافقين للزواج، وفقاً للقيم الإسلامية. المنصة مخصصة حصرياً لأغراض الزواج الجاد.

4. تسجيل الحساب

أنت مسؤول عن:

- الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك
- جميع الأنشطة التي تتم تحت حسابك
- إخطارنا فوراً بأي استخدام غير مصرح به
- تقديم معلومات دقيقة وصادقة فقط

5. سلوك المستخدم

عند استخدامك لتطبيق Al-Aqd، فإنك توافق على عدم القيام بما يلي:

- استخدام هوية مزيفة أو انتحال شخصية شخص آخر
- نشر محتوى غير لائق أو مسيء أو غير قانوني
- التحرش بالمستخدمين الآخرين أو تهديدهم أو إيذائهم
- إرسال رسائل غير مرغوب فيها أو رسائل تجارية
- استخدام التطبيق لأي غرض غير البحث الجاد عن الزواج
- مشاركة حسابك مع آخرين
- محاولة تجاوز إجراءات الأمان لدينا أو استخراج البيانات
- استخدام التطبيق للترويج لأي خدمة أخرى

6. المحتوى الذي تقدمه

تحتفظ بملكية المحتوى الذي تنشره على Al-Aqd. بنشرك للمحتوى، فإنك تمنحنا ترخيصاً غير حصري لعرضه داخل التطبيق للمستخدمين الآخرين.

أنت وحدك مسؤول عن المحتوى الذي تنشره. نحتفظ بالحق في إزالة أي محتوى ينتهك هذه الشروط.

7. المحرم والولي

تماشياً مع المبادئ الإسلامية، يتم تشجيع المستخدمات على تعيين محرم أو ولي موثوق. قد نقوم بإبلاغهم عند بدء المحادثات، وفقاً لإعداداتك.

8. الاشتراكات والمدفوعات

يقدم Al-Aqd ميزات مجانية ومميزة. تُدفع الاشتراكات المميزة مقدماً وتجدد تلقائياً ما لم يتم إلغاؤها. تخضع المبالغ المستردة لقوانين حماية المستهلك المعمول بها.

9. تعليق الحساب وإنهاؤه

نحتفظ بالحق في تعليق حسابك أو إنهائه إذا انتهكت هذه الشروط، أو قمت بنشاط احتيالي، أو أسأت استخدام المنصة. يمكنك حذف حسابك في أي وقت من الإعدادات.

10. إخلاء المسؤولية

يتم توفير Al-Aqd "كما هو". نحن لا نضمن أنك ستجد شريك حياة. نحن لا نجري فحوصات للسجل الجنائي للمستخدمين. توخَّ الحذر دائماً عند التفاعل مع الأشخاص الذين تقابلهم عبر الإنترنت.

11. تحديد المسؤولية

إلى الحد الأقصى الذي يسمح به القانون، لن يكون Al-Aqd مسؤولاً عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك للتطبيق.

12. التغييرات على هذه الشروط

قد نقوم بتحديث شروط الاستخدام هذه. سنخطرك بالتغييرات المهمة عبر التطبيق. يعتبر استخدامك المستمر بعد التغييرات قبولاً للشروط الجديدة.

13. القانون المعمول به

تخضع هذه الشروط لقوانين بلجيكا. سيتم تسوية أي نزاع أمام محاكم بروكسل.

14. التواصل

للاستفسارات حول هذه الشروط، تواصل معنا عبر:
support@al-aqd.com`;

const TERMS_ES = `TÉRMINOS DE USO

Última actualización: abril de 2026

1. ACEPTACIÓN DE LOS TÉRMINOS

Al crear una cuenta y utilizar Al-Aqd, usted acepta estar sujeto a estos Términos de Uso. Si no está de acuerdo, no utilice la aplicación.

2. ELEGIBILIDAD

Para utilizar Al-Aqd, usted debe:

- Tener al menos 18 años de edad
- Tener la capacidad legal para celebrar un acuerdo vinculante
- No estar prohibido de utilizar el servicio según la ley aplicable
- Proporcionar información precisa, completa y actualizada

3. PROPÓSITO DE LA APLICACIÓN

Al-Aqd es una aplicación matrimonial diseñada para ayudar a los musulmanes a encontrar parejas compatibles para el matrimonio, de acuerdo con los valores islámicos. La plataforma está destinada exclusivamente a fines matrimoniales serios.

4. REGISTRO DE CUENTA

Usted es responsable de:

- Mantener la confidencialidad de sus credenciales
- Toda actividad que ocurra bajo su cuenta
- Notificarnos inmediatamente cualquier uso no autorizado
- Proporcionar únicamente información precisa y veraz

5. CONDUCTA DEL USUARIO

Al utilizar Al-Aqd, usted se compromete a NO:

- Usar una identidad falsa o suplantar a otra persona
- Publicar contenido inapropiado, ofensivo o ilegal
- Acosar, amenazar o dañar a otros usuarios
- Enviar spam o mensajes comerciales
- Utilizar la aplicación para fines distintos al matrimonio serio
- Compartir su cuenta con otros
- Intentar eludir nuestras medidas de seguridad o extraer datos
- Utilizar la aplicación para promover cualquier otro servicio

6. CONTENIDO QUE USTED PROPORCIONA

Usted conserva la propiedad del contenido que publica en Al-Aqd. Al publicarlo, nos otorga una licencia no exclusiva para mostrarlo dentro de la aplicación a otros usuarios.

Usted es el único responsable del contenido publicado. Nos reservamos el derecho de eliminar cualquier contenido que infrinja estos términos.

7. MAHRAM Y TUTOR

De acuerdo con los principios islámicos, se anima a las usuarias a designar un mahram o tutor de confianza. Podemos notificarles cuando comiencen las comunicaciones, según su configuración.

8. SUSCRIPCIONES Y PAGOS

Al-Aqd ofrece funciones gratuitas y premium. Las suscripciones premium se facturan por adelantado y se renuevan automáticamente a menos que se cancelen. Los reembolsos están sujetos a la legislación de consumo aplicable.

9. SUSPENSIÓN Y CANCELACIÓN DE LA CUENTA

Nos reservamos el derecho de suspender o cancelar su cuenta si infringe estos Términos, realiza actividades fraudulentas o hace mal uso de la plataforma. Puede eliminar su cuenta en cualquier momento desde la configuración.

10. EXENCIONES DE RESPONSABILIDAD

Al-Aqd se proporciona "tal cual". No garantizamos que encontrará pareja. No realizamos verificaciones de antecedentes penales de los usuarios. Tenga siempre precaución al interactuar con personas que conozca en línea.

11. LIMITACIÓN DE RESPONSABILIDAD

En la máxima medida permitida por la ley, Al-Aqd no será responsable de ningún daño indirecto, incidental o consecuente derivado del uso de la aplicación.

12. CAMBIOS EN ESTOS TÉRMINOS

Podemos actualizar estos Términos de Uso. Le notificaremos los cambios importantes a través de la aplicación. El uso continuado después de los cambios constituye aceptación.

13. LEY APLICABLE

Estos Términos se rigen por las leyes de Bélgica. Cualquier disputa se resolverá en los tribunales de Bruselas.

14. CONTACTO

Para preguntas sobre estos Términos, contáctenos en:
support@al-aqd.com`;

// ─── Seed entries ────────────────────────────────────────────────────────────

const ENTRIES = [
    { type: 'privacy', language: 'en', title: 'Privacy Policy', content: PRIVACY_EN },
    { type: 'privacy', language: 'fr', title: 'Politique de Confidentialité', content: PRIVACY_FR },
    { type: 'privacy', language: 'ar', title: 'سياسة الخصوصية', content: PRIVACY_AR },
    { type: 'privacy', language: 'es', title: 'Política de Privacidad', content: PRIVACY_ES },
    { type: 'terms', language: 'en', title: 'Terms of Use', content: TERMS_EN },
    { type: 'terms', language: 'fr', title: "Conditions d'Utilisation", content: TERMS_FR },
    { type: 'terms', language: 'ar', title: 'شروط الاستخدام', content: TERMS_AR },
    { type: 'terms', language: 'es', title: 'Términos de Uso', content: TERMS_ES },
];

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('✅ Connected');

    let created = 0;
    let updated = 0;

    for (const entry of ENTRIES) {
        const existing = await LegalDocument.findOne({
            type: entry.type,
            language: entry.language,
        });

        if (existing) {
            existing.title = entry.title;
            existing.content = entry.content;
            // Don't bump version on a re-seed
            await existing.save();
            updated++;
            console.log(`  Updated: ${entry.type} / ${entry.language}`);
        } else {
            await LegalDocument.create({ ...entry, version: 1 });
            created++;
            console.log(`  Created: ${entry.type} / ${entry.language}`);
        }
    }

    console.log(`\n✅ Done. Created ${created}, updated ${updated}.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
