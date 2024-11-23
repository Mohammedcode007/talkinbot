const items = [
    // الحيوانات
    { emoji: "🐶", text: "You got a cute dog that resembles your loyalty!" },
    { emoji: "🐱", text: "You got a charming cat that brings joy!" },
    { emoji: "🐭", text: "You got a tiny mouse, small but clever!" },
    { emoji: "🐹", text: "You got an adorable hamster full of energy!" },
    { emoji: "🐰", text: "You got a lovely rabbit, as soft as a dream!" },
    { emoji: "🦊", text: "You got a clever fox, always one step ahead!" },
    { emoji: "🐻", text: "You got a cuddly bear, strong and protective!" },
    { emoji: "🐼", text: "You got a panda, a symbol of peace and cuteness!" },
    { emoji: "🐻‍❄️", text: "You got a polar bear, as cool as the Arctic!" },
    { emoji: "🐨", text: "You got a koala, calm and lovable!" },
    { emoji: "🐯", text: "You got a tiger, fierce and brave!" },
    { emoji: "🦁", text: "You got a lion, the king of the jungle!" },
    { emoji: "🐮", text: "You got a cow, a provider of nourishment!" },
    { emoji: "🐷", text: "You got a pig, a sign of fortune and abundance!" },
    { emoji: "🐸", text: "You got a frog, ready to leap to success!" },
    { emoji: "🐵", text: "You got a monkey, playful and curious!" },
    { emoji: "🐔", text: "You got a chicken, bringing fresh beginnings!" },
    { emoji: "🐧", text: "You got a penguin, cool and unique!" },
    { emoji: "🐦", text: "You got a bird, spreading freedom and joy!" },
    { emoji: "🐤", text: "You got a chick, full of youthful energy!" },
    { emoji: "🐣", text: "You got a hatching chick, a symbol of new life!" },
    { emoji: "🦆", text: "You got a duck, calm on the surface but focused!" },
    { emoji: "🦅", text: "You got an eagle, soaring high above challenges!" },
    { emoji: "🦉", text: "You got an owl, wise and insightful!" },
    { emoji: "🦇", text: "You got a bat, mysterious yet fascinating!" },
    { emoji: "🐺", text: "You got a wolf, loyal and strong in spirit!" },
    { emoji: "🐗", text: "You got a wild boar, unstoppable and bold!" },
    { emoji: "🐴", text: "You got a horse, fast and determined!" },
    { emoji: "🦄", text: "You got a unicorn, magical and full of wonder!" },
    // الملابس
    { emoji: "👚", text: "You got a blouse, stylish and elegant!" },
    { emoji: "👕", text: "You got a T-shirt, casual and comfortable!" },
    { emoji: "👖", text: "You got jeans, durable and reliable!" },
    { emoji: "👔", text: "You got a tie, professional and sharp!" },
    { emoji: "👗", text: "You got a dress, graceful and classy!" },
    { emoji: "👙", text: "You got a bikini, perfect for sunny beaches!" },
    { emoji: "👘", text: "You got a kimono, cultural and beautiful!" },
    { emoji: "👠", text: "You got a high heel, fashionable and bold!" },
    { emoji: "👡", text: "You got sandals, cool and breezy!" },
    { emoji: "👢", text: "You got boots, tough and adventurous!" },
    { emoji: "👞", text: "You got shoes, reliable for every journey!" },
    { emoji: "👟", text: "You got sneakers, sporty and active!" },
    { emoji: "🎩", text: "You got a top hat, classic and elegant!" },
    { emoji: "🧢", text: "You got a cap, casual and trendy!" },
    { emoji: "🪖", text: "You got a helmet, protective and secure!" },
    { emoji: "⛑️", text: "You got a safety helmet, ready for challenges!" },
    { emoji: "👒", text: "You got a sunhat, perfect for sunny days!" },
    { emoji: "🥽", text: "You got goggles, ready for action!" },
    { emoji: "🥼", text: "You got a lab coat, scientific and smart!" },
    { emoji: "🦺", text: "You got a vest, ready for the outdoors!" },
    // الفواكه
    { emoji: "🍎", text: "You got an apple, fresh and healthy!" },
    { emoji: "🍊", text: "You got an orange, juicy and refreshing!" },
    { emoji: "🍌", text: "You got a banana, sweet and energizing!" },
    { emoji: "🍉", text: "You got a watermelon, perfect for summer!" },
    { emoji: "🍇", text: "You got grapes, tiny bursts of sweetness!" },
    { emoji: "🍓", text: "You got strawberries, red and delightful!" },
    { emoji: "🍒", text: "You got cherries, small but irresistible!" },
    { emoji: "🍍", text: "You got a pineapple, tropical and delicious!" },
    { emoji: "🥭", text: "You got a mango, sweet and exotic!" },
    { emoji: "🥝", text: "You got a kiwi, unique and zesty!" },
    { emoji: "🍅", text: "You got a tomato, versatile and flavorful!" },
    { emoji: "🥥", text: "You got a coconut, refreshing and tropical!" },
    { emoji: "🥑", text: "You got an avocado, creamy and nutritious!" },
    { emoji: "🍆", text: "You got an eggplant, versatile and tasty!" },
    { emoji: "🥔", text: "You got a potato, simple yet satisfying!" },
    { emoji: "🥕", text: "You got a carrot, crunchy and sweet!" },
    { emoji: "🌽", text: "You got corn, golden and delicious!" },
    { emoji: "🌶️", text: "You got a chili pepper, spicy and exciting!" },
    { emoji: "🥒", text: "You got a cucumber, fresh and hydrating!" },
    { emoji: "🥬", text: "You got lettuce, crisp and light!" },
    { emoji: "🧠", text: "You got a brain, symbolizing intelligence and creativity!" },
    { emoji: "💪", text: "You got strength, a sign of power and resilience!" },
    { emoji: "❤️", text: "You got a heart, showing love and compassion!" },
    { emoji: "🦸‍♂️", text: "You got a superhero, representing bravery and leadership!" },
    { emoji: "🦸‍♀️", text: "You got a heroine, symbolizing courage and empowerment!" },
    { emoji: "🦄", text: "You got a unicorn, representing uniqueness and imagination!" },
    { emoji: "🌟", text: "You got a star, shining bright with talent and charisma!" },
    { emoji: "🔥", text: "You got fire, full of passion and energy!" },
    { emoji: "🎨", text: "You got a palette, representing artistic creativity!" },
    { emoji: "📚", text: "You got books, symbolizing wisdom and knowledge!" },
    { emoji: "🌈", text: "You got a rainbow, bringing positivity and hope!" },
    { emoji: "⚡", text: "You got lightning, symbolizing energy and speed!" },
    { emoji: "💎", text: "You got a diamond, symbolizing value and strength!" },
    { emoji: "🚀", text: "You got a rocket, representing ambition and progress!" },
    { emoji: "🌍", text: "You got Earth, showing global awareness and unity!" },
  ];
  
  const hikam =  [
    {"id": 1, "text": "من جرب مصاعب الحياة، تعلم أن السكينة هي أغلى ما يمتلك."},
    {"id": 2, "text": "إذا كانت القوة في الجسد، فإن الحكمة في العقل."},
    {"id": 3, "text": "أصعب معركة هي معركة الإنسان مع نفسه."},
    {"id": 4, "text": "من أضاع وقتاً فقد أضاع حياته."},
    {"id": 5, "text": "المال يذهب، ولكن العلم يبقى."},
    {"id": 6, "text": "لا تسعى وراء القمة قبل أن تستعد لها."},
    {"id": 7, "text": "الشجاعة ليست في الوقوف أمام الخوف، بل في الاستمرار رغم الخوف."},
    {"id": 8, "text": "العقل هو الزمان الذي يسير بنا عبر الطرق المظلمة."},
    {"id": 9, "text": "من يعش في الظلام لن يميز بين النور والظلال."},
    {"id": 10, "text": "الكلمة الطيبة كالدواء تداوي الجروح."},
    {"id": 11, "text": "الذي يظن أنه يملك الحقيقة هو في الحقيقة يملك وهمها."},
    {"id": 12, "text": "لا تستحق الحياة السعادة إلا إذا عرفت كيف تعيشها."},
    {"id": 13, "text": "أقوى الناس من يظل مبتسمًا في وجه المصاعب."},
    {"id": 14, "text": "من لا يتعلم من أخطائه، سيظل يكررها إلى الأبد."},
    {"id": 15, "text": "لا يوجد شيء في الدنيا أثمن من الوقت."},
    {"id": 16, "text": "الظلام لا يقاوم بالنور، بل بالثبات في الظلام."},
    {"id": 17, "text": "إذا لم تستطيع أن تكون الأفضل، كن الأفضل في ما أنت فيه."},
    {"id": 18, "text": "القوة الحقيقية هي أن لا تسمح لضعفك أن يتحكم فيك."},
    {"id": 19, "text": "كلما ارتفعت طموحاتك، ارتفعت كذلك تحدياتك."},
    {"id": 20, "text": "إذا كنت لا تستطيع الصعود، فانتظر حتى يصل إليك الآخرون."},
    {"id": 21, "text": "الرغبات التي لا تُستجاب، هي دروس ستعلمك الكثير عن الحياة."},
    {"id": 22, "text": "الأشياء العظيمة لا تحدث أبدًا في مناطق الراحة."},
    {"id": 23, "text": "من يشعر أنه في مكانه لا يمكنه أن يصل إلى أي مكان."},
    {"id": 24, "text": "الحكمة لا تأتي من الحياة السهلة، بل من التجارب الصعبة."},
    {"id": 25, "text": "السكون لا يعني الاستسلام، بل ربما هو إعادة التفكير."},
    {"id": 26, "text": "التردد أحيانًا هو أقوى عدو يواجهه الإنسان."},
    {"id": 27, "text": "البعض يقيسون النجاح بالمال، وآخرون يقيسونه بالسعادة."},
    {"id": 28, "text": "الابتسامة في وجه المصاعب هي أبلغ رد."},
    {"id": 29, "text": "نحن نعيش على الأمل، لكنه قد يأتي في صورة دمعة."},
    {"id": 30, "text": "كلما زادت التحديات، زاد فيك النمو."},
    {"id": 31, "text": "الناس لا يخافون من الفشل، بل من النجاح غير المتوقع."},
    {"id": 32, "text": "التغيير يبدأ في اللحظة التي تقرر فيها أن تكون أفضل."},
    {"id": 33, "text": "لا يمكن أن تكون قائدًا عظيمًا إذا لم تكن لديك القدرة على القيادة."},
    {"id": 34, "text": "الشخص الذي لا يعرف كيف يتراجع، لا يعرف كيف يتقدم."},
    {"id": 35, "text": "الظروف لا تحدد حياتك، بل الطريقة التي تواجه بها هذه الظروف."},
    {"id": 36, "text": "أعظم اكتشافات الإنسان هي التي يجدها في نفسه."},
    {"id": 37, "text": "النجاح لا يعني الهروب من الفشل، بل يعني مواجهة الفشل بثقة."},
    {"id": 38, "text": "من فقد الأمل، فقد الحياة."},
    {"id": 39, "text": "الصبر على المصاعب يعطيك قوة لم تكن تدركها."},
    {"id": 40, "text": "كل من يسير في طريق النجاح سيلتقي بمصاعب، لكن العظمة تأتي من التغلب عليها."},
    {"id": 41, "text": "ليس النجاح أن تكون في القمة، بل أن تبقى فيها."},
    {"id": 42, "text": "العظمة لا تأتي من القوة، بل من القدرة على التحمل."},
    {"id": 43, "text": "التحديات الحقيقية تأتي عندما تبدأ في الإيمان بنفسك."},
    {"id": 44, "text": "العقول العظيمة لا تكف عن التفكير حتى في أوقات الراحة."},
    {"id": 45, "text": "الإنسان القوي هو الذي يستطيع أن يبقى صامدًا أمام الرياح العاتية."},
    {"id": 46, "text": "اللحظة التي يعتقد فيها الإنسان أنه يعرف كل شيء هي اللحظة التي يبدأ فيها ضياعه."},
    {"id": 47, "text": "العقل لا يعرف حدودًا، لكن من صنعوا الحدود هم من يظنون أن هناك حدودًا."},
    {"id": 48, "text": "القلب النقي هو الذي يعرف كيف يصفح، لكن ليس دائمًا بسهولة."},
    {"id": 49, "text": "في قلب كل إنسان حكاية لا يستطيع أحد أن يرويها إلا هو."},
    {"id": 50, "text": "الحياة لا تذهب إلى حيث تذهب أنت، بل أنت تذهب إلى حيث تأخذ الحياة."},
    {"id": 51, "text": "إذا لم تكن جزءًا من الحل، فأنت جزء من المشكلة."},
    {"id": 52, "text": "النجاح الحقيقي هو أن تتقبل كل ما يصادفك، وتحوله إلى فرصة."},
    {"id": 53, "text": "العقل هو الذي يحدد المسافة بين النجاح والفشل."},
    {"id": 54, "text": "الحكمة في العيش هي أن تدرك أن الوقت هو أثمن ما تملك."},
    {"id": 55, "text": "لكل شيء في الحياة ثمناً، لكن أكثر ما نندم عليه هو الوقت."},
    {"id": 56, "text": "القوة ليست في القدرة على الهجوم، بل في القدرة على التحمل."},
    {"id": 57, "text": "من يظن أن الحياة لعبة، يكتشف بعد فوات الأوان أنها معركة."},
    {"id": 58, "text": "التحديات تعني أن هناك فرصة للنمو والتغيير."},
    {"id": 59, "text": "إن قدرتك على النجاح تعتمد على قدرتك على التحمل."},
    {"id": 60, "text": "الرغبة في التغيير هي خطوة أولى نحو النجاح."},
    {"id": 61, "text": "التوقف عن المحاولة هو بداية الفشل."},
    {"id": 62, "text": "العقل لا يهدأ حتى في أوقات الهدوء."},
    {"id": 63, "text": "إذا أردت أن تكون عظيماً، فكن صادقاً مع نفسك أولاً."},
    {"id": 64, "text": "نحن لا نعيش في عصرنا، بل نحن نعيش في لحظاتنا."},
    {"id": 65, "text": "الشخص الذي يكتشف ذاته يكون قد امتلك الدنيا."},
    {"id": 66, "text": "الظروف القاسية تخلق أشخاصًا أقوى."},
    {"id": 67, "text": "من يغرق في قسوة الحياة، يجد السكينة في الإيمان."},
    {"id": 68, "text": "العقل هو السلاح الأبرز في مواجهة التحديات."},
    {"id": 69, "text": "الفشل ليس نهاية، بل بداية لنجاح جديد."},
    {"id": 70, "text": "الثقة في النفس هي سر النجاح."},
    {"id": 71, "text": "النجاح لا يأتي مصادفة، بل هو ثمرة المثابرة."},
    {"id": 72, "text": "كل لحظة في حياتك هي فرصة لتكون أفضل."},
    {"id": 73, "text": "أعظم الحروب هي التي نخوضها في داخل أنفسنا."}]  


  

  

  
  module.exports = {items,hikam};
  