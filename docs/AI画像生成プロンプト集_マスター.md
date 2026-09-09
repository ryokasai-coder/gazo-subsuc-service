# AI画像生成プロンプト集（マスタードキュメント）

> **この文書の位置づけ（DESIGN BOX 開発依頼書「テンプレート設定（5節）」の正典）**
>
> これまで作成した生成プロンプトを、最新版だけを残して1つにまとめたものです。今後新しい参考画像を追加する際も、このドキュメントに追記していきます（別ファイルには分散させません）。開発依頼書の「テンプレート設定（5節）」はこの文書の内容で置き換えます。
>
> 参考画像ファイルの番号は 01〜15（以降 16〜26 も同様）の通し番号に整理し直しています。
>
> 実装対応状況（2026-09-03 時点）:
> - **01〜06**: コード実装済み（`lib/design-prompts.ts` の `buildReferencePrompt` / `TEMPLATE_FIELDS`、参考画像は `lib/reference-images.ts`）。※現行は顧客画像1枚（Image 2）のみ対応。
> - **07〜26**: 未実装（参考画像 `references/07_*.png`〜`references/26_*.png` が未入手）。
> - ⚠️【要確認】複数画像スロット（Image3〜N・QR/ロゴを別画像として渡す）は現行API未対応。フル実装には `app/api/design/generate/route.ts` と依頼フォームの複数アップロード対応が必要。

---

## 共通のシステム指示（全テンプレート共通で毎回一緒に送る）

```
あなたはプロの販促デザイナーです。
入力される1枚目の画像(Image 1)は固定の参考デザインテンプレート、2枚目以降の画像は顧客側で用意された画像です(写真の場合とQRコード・ロゴ画像の場合があり、テンプレートによって異なります)。
Image 1のレイアウト・配色・装飾・フォントの雰囲気は完全に維持したまま、指示に従って該当箇所だけを差し替えて1枚の画像を生成してください。
Image 1に存在しない装飾・ロゴ・文字は追加しないでください。
```

---

## テンプレート一覧

| No | テンプレートID | 内容 | 追加写真枚数 | QR/ロゴ画像 |
|----|----------------|------|------|------|
| 01 | spa_open | スパ&マッサージOPEN告知 | 1 | 予約QR(任意) |
| 02 | yakiniku_bento | 焼肉弁当メニュー | 7 | 注文QR |
| 03 | takeout_bento | テイクアウト弁当メニュー | 9 | 注文QR |
| 04 | esthe_pink | エステ集客(ピンク) | 3 | LINE QR |
| 05 | esthe_gold | エステ集客(ゴールド) | 4 | LINE QR |
| 06 | line_guide | LINE友だち登録案内(丘イラスト版) | 0 | QR |
| 07 | ramen_main | ラーメン店メインチラシ | 5 | LINEクーポンQR |
| 08 | line_benefits | LINE友だち追加3特典(グリーン) | 0 | QR |
| 09 | sns_annotation | 手描き風・料理写真+吹き出し | 1 | なし |
| 10 | calendar | 営業カレンダー | 1 | なし |
| 11 | recommend_menu | おすすめメニュー(リーフ柄) | 4 | なし |
| 12 | spring_sale | 春の感謝祭セール | 4 | なし |
| 13 | single_item_dark | 単品広告(黒背景) | 1 | なし |
| 14 | smoothie_single | スムージー単品訴求 | 1 | ロゴ(任意) |
| 15 | smoothie_trio | スムージー3種展開 | 3 | なし |
| 16 | veggie_focaccia_poster | ローストベジフォカッチャ(英語ポスター) | 1 | なし |
| 17 | ingredient_diagram_sandwich | 具材ラベル付きサンドイッチ図解 | 1 | なし |
| 18 | strawberry_milk_kakigori | 苺みるくかき氷 | 1 | なし |
| 19 | strawberry_pistachio_crepe | ストロベリーピスタチオクレープ | 1 | なし |
| 20 | bakery_opening_day | ベーカリーOPEN告知(イラスト) | 0 | なし |
| 21 | new_open_690_campaign | NEW OPEN 690円均一キャンペーン | 3 | なし |
| 22 | weekend_brunch_plate | 週末ブランチ・選べるプレート | 3 | なし |
| 23 | yakitori_menu | 炭火串焼きMENU | 8 | なし |
| 24 | colorful_bowl_lunch | 選べる彩りボウル | 4 | なし |
| 25 | teppan_gyoza_menu | 鉄板ぎょうざメニュー | 1 | なし |
| 26 | charcoal_saba_ju | 炭火香るさば重 | 1 | なし |

---

## 01. spa_open（スパ&マッサージ OPEN告知）

**参考画像ファイル:** `references/01_spa_open.png`

**画像スロット:** Image2=メイン施術写真／Image3=予約QRコード(任意)

**必要な入力項目:** shop_name, catch_copy, feature_1〜3, open_label(既定値"OPEN"), open_date, reservation_label(既定値"ご予約専用"), sub_notice_text, campaign_1_title, campaign_1_discount, campaign_1_deadline, campaign_2_title, campaign_2_discount, campaign_2_deadline

**プロンプト**

```
- 中央メイン写真をImage 2の顧客写真に置き換えてください。
- 右上の円形ロゴバッジのテキストを「{shop_name}」に変更してください。
- 左上のキャッチコピーを「{catch_copy}」に変更してください。
- 中央下部の"{open_label}"表記の日付部分を「{open_date}」に変更してください。
- 右側の白い円形バッジ3つを「{feature_1}」「{feature_2}」「{feature_3}」に変更してください。
- テラコッタ色の予約ボックスの文言を「{reservation_label}」に変更してください。QRコード風アイコンが実際の予約QRの場合はImage 3に置き換えてください。
- 見出し下の説明文を「{sub_notice_text}」に変更してください。
- 下部の特典ボックス2つを「{campaign_1_title} {campaign_1_discount}(期間限定:{campaign_1_deadline}まで)」「{campaign_2_title} {campaign_2_discount}(期間限定:{campaign_2_deadline}まで)」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 02. yakiniku_bento（焼肉弁当メニュー）

**参考画像ファイル:** `references/02_yakiniku_bento.png`

**画像スロット:** Image2〜8=写真7枚／Image9=注文QRコード

**必要な入力項目:** shop_name, tagline_label(既定値"焼肉弁当"), seasonal_mark_text(既定値"秋"), item_name_1〜4, price_1〜4, desc_1〜4, rice_note, tel, reception_hours, pickup_hours, holiday, address, order_qr_label(既定値"ご注文はこちらから")

**プロンプト**

```
写真は7箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率・アングル・照明の雰囲気はImage 1に合わせてください。
- 左上のグリル(焼肉クローズアップ)写真 → Image 2に置き換え
- 右上の外観写真(店舗夜景) → Image 3に置き換え
- 特上カルビ弁当の写真 → Image 4に置き換え
- 牛タン弁当の写真 → Image 5に置き換え
- 国産豚ロース弁当の写真 → Image 6に置き換え
- 鶏もも・せせり弁当の写真 → Image 7に置き換え
- 左下の冷蔵庫内の肉写真 → Image 8に置き換え

- 左上の毛筆ロゴ部分のテキストを「{shop_name}」に変更してください。書体・配色のスタイルはImage 1と同じにしてください。
- ロゴ下の表記を「{tagline_label}」に変更してください。
- 左上の飾り印の文字を「{seasonal_mark_text}」に変更してください。
- 各弁当の商品名・価格・説明文を「{item_name_1} {price_1}円 {desc_1}」「{item_name_2} {price_2}円 {desc_2}」「{item_name_3} {price_3}円 {desc_3}」「{item_name_4} {price_4}円 {desc_4}」に変更してください。
- ご飯に関する注記を「{rice_note}」に変更してください。
- フッターの電話番号を「{tel}」、受付時間を「{reception_hours}」、お渡し時間を「{pickup_hours}」、定休日を「{holiday}」、住所を「{address}」に変更してください。
- フッター右下のQRコードをImage 9の顧客QRコードに置き換え、ラベルを「{order_qr_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 03. takeout_bento（テイクアウト弁当メニュー）

**参考画像ファイル:** `references/03_takeout_bento.png`

**画像スロット:** Image2〜10=写真9枚／Image11=注文QRコード

**必要な入力項目:** headline, intro_text, shop_tagline(既定値"お弁当・お惣菜"), delivery_badge_text(既定値"1個から宅配承ります"), item_name_1〜6, price_1〜6, feature_1〜3, shop_name, address, hours, holiday, tel, fax, notice_text, order_qr_label(既定値"WEB注文はこちらから")

**プロンプト**

```
写真は9箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率・構図はImage 1に合わせてください。
- 上部写真タイル1枚目 → Image 2に置き換え
- 上部写真タイル2枚目 → Image 3に置き換え
- 上部写真タイル3枚目 → Image 4に置き換え
- 商品グリッド1品目の写真 → Image 5に置き換え
- 商品グリッド2品目の写真 → Image 6に置き換え
- 商品グリッド3品目の写真 → Image 7に置き換え
- 商品グリッド4品目の写真 → Image 8に置き換え
- 商品グリッド5品目の写真 → Image 9に置き換え
- 商品グリッド6品目の写真 → Image 10に置き換え

- 見出しコピーを「{headline}」に変更してください("できたて手作り／お弁当／はじめました"に相当する3行構成は維持してください)。
- 中段の紹介文を「{intro_text}」に変更してください。
- ロゴ下のタグラインを「{shop_tagline}」に変更してください。
- 宅配バッジの文言を「{delivery_badge_text}」に変更してください。
- 6品グリッドの商品名・価格を「{item_name_1} {price_1}円」〜「{item_name_6} {price_6}円」に変更してください。
- 3つの特徴アイコン文言を「{feature_1}」「{feature_2}」「{feature_3}」に変更してください。
- フッターの店舗名を「{shop_name}」、住所を「{address}」、営業時間を「{hours}」、定休日を「{holiday}」、電話を「{tel}」、FAXを「{fax}」に変更してください。
- フッターの注意書きを「{notice_text}」に変更してください。
- 右下のQRコードをImage 11の顧客QRコードに置き換え、ラベルを「{order_qr_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 04. esthe_pink（エステ集客・ピンク）

**参考画像ファイル:** `references/04_esthe_pink.png`

**画像スロット:** Image2=メイン施術写真／Image3=キャンペーン欄の小写真／Image4=サロン内観写真／Image5=LINE QRコード

**必要な入力項目:** ribbon_text(既定値"大人女性のための"), headline, salon_name, anniversary_badge, sub_catch, feature_1〜3, course_name, check_1〜5, regular_price, special_price, campaign_notes(既定値"お一人様1回限り／他の割引との併用不可"), reasons_title(既定値"当サロンが選ばれる理由"), reason_1〜5, business_hours, holiday, tel, address, access, line_promo_text(既定値"友だち追加でお得なクーポンをプレゼント!")

**プロンプト**

```
- 上部リボンの文言を「{ribbon_text}」に変更してください。
- 見出しコピーを「{headline}」、サロン名ボックスを「{salon_name}」に変更してください。
- 右上の周年バッジを「{anniversary_badge}」、その下の訴求フレーズを「{sub_catch}」に変更してください。
- メイン施術写真をImage 2に置き換えてください。
- 3つの特徴アイコンの文言を「{feature_1}」「{feature_2}」「{feature_3}」に変更してください。
- 体験コースボックスのコース名を「{course_name}」、チェックリスト5項目を「{check_1}」〜「{check_5}」、通常価格を「{regular_price}円」、特別価格を「{special_price}円」、注意書きを「{campaign_notes}」に変更してください。ボックス内の小写真をImage 3に置き換えてください。
- 「{reasons_title}」の5項目を「{reason_1}」〜「{reason_5}」に変更してください。
- フッター付近のサロン内観写真をImage 4に置き換えてください。
- LINE友だち登録欄の文言を「{line_promo_text}」に変更し、QRコードをImage 5に置き換えてください。
- フッターの受付時間を「{business_hours}」、定休日を「{holiday}」、電話番号を「{tel}」、住所を「{address}」、最寄駅情報を「{access}」に変更してください。アクセスマップのイラストは簡略化された図として構成を保ち、駅名の文字だけ差し替えてください(実際の地図の正確な再現は不要です)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 05. esthe_gold（エステ集客・ゴールド）

**参考画像ファイル:** `references/05_esthe_gold.png`

**画像スロット:** Image2=メイン施術写真／Image3=キャンペーン欄の小写真／Image4=コースA写真／Image5=コースB写真／Image6=コースC写真／Image7=LINE QRコード

**必要な入力項目:** headline, side_banner_text, salon_name, feature_1〜3, course_name, check_1〜5, regular_price, special_price, campaign_notes, reasons_title, reason_1〜5, course_a_name, course_a_time, course_a_desc, course_a_price, course_b_name, course_b_time, course_b_desc, course_b_price, course_c_name, course_c_time, course_c_desc, course_c_price, tel, address, access, line_promo_text(既定値"ご予約はLINEで簡単予約")

**プロンプト**

```
- 見出しコピーを「{headline}」、サロン名ボックスを「{salon_name}」に変更してください。
- 右サイドの縦書き訴求フレーズを「{side_banner_text}」に変更してください。
- メイン施術写真をImage 2に置き換えてください。
- 3つの特徴アイコンの文言を「{feature_1}」「{feature_2}」「{feature_3}」に変更してください。
- 体験コースボックスのコース名を「{course_name}」、チェックリスト5項目を「{check_1}」〜「{check_5}」、通常価格を「{regular_price}円」、特別価格を「{special_price}円」、注意書きを「{campaign_notes}」に変更してください。ボックス内の小写真をImage 3に置き換えてください。
- 「{reasons_title}」の5項目を「{reason_1}」〜「{reason_5}」に変更してください。
- 下部3つのコース料金ボックスを、1つ目「{course_a_name} {course_a_time} {course_a_desc} {course_a_price}円」(写真はImage 4)、2つ目「{course_b_name} {course_b_time} {course_b_desc} {course_b_price}円」(写真はImage 5)、3つ目「{course_c_name} {course_c_time} {course_c_desc} {course_c_price}円」(写真はImage 6)に変更してください。
- LINE予約欄の文言を「{line_promo_text}」に変更し、QRコードをImage 7に置き換えてください。
- フッターの電話番号を「{tel}」、住所を「{address}」、最寄駅情報を「{access}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 06. line_guide（LINE公式アカウント友だち登録案内・丘イラスト版）

**参考画像ファイル:** `references/06_line_guide.png`

**画像スロット:** Image2=顧客のQRコード画像

**必要な入力項目:** line_id, promo_text, headline(既定値"友だち登録募集中!"), method_section_title(既定値"LINE「友だち追加」方法"), method_1_label(既定値"「QRコード」で登録"), method_1_instructions, method_2_label(既定値"「ID検索」で登録"), method_2_instructions, company_name

**プロンプト**

```
- LINE IDの表記を「{line_id}」に変更してください。
- 吹き出しの訴求文言を「{promo_text}」に変更してください。
- 大見出しを「{headline}」に変更してください。
- セクションタイトルを「{method_section_title}」に変更してください。
- 方法1のラベルを「{method_1_label}」、説明文を「{method_1_instructions}」に変更してください。
- 方法2のラベルを「{method_2_label}」、説明文を「{method_2_instructions}」に変更してください。
- スマホ画面内・本文中のQRコードをImage 2の顧客QRコードに置き換えてください。
- フッターの会社名・店舗名を「{company_name}」に変更してください。
- 下部の丘・家・木・電気自動車のイラスト、レイアウト構成は変更しないでください(純粋な装飾イラストのため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 07. ramen_main（ラーメン店 メインチラシ）

**参考画像ファイル:** `references/07_ramen_main.png`

**画像スロット:** Image2〜6=写真5枚／Image7=LINEクーポンQRコード

**必要な入力項目:** shop_name, headline, title, sub_copy, point_1_title, point_1_desc, point_2_title, point_2_desc, point_3_title, point_3_desc, side_banner_text, checklist_title(既定値"◯◯のこだわり"), check_1〜5, item_name_1〜3, price_1〜3, item_desc_1〜3, review_1_title, review_1_comment, review_1_profile, review_2_title, review_2_comment, review_2_profile, review_3_title, review_3_comment, review_3_profile, coupon_text, coupon_step_1〜3(既定値"友だち追加"/"トークで確認"/"クーポンGET!"), hours, holiday, tel, address, station_access

**プロンプト**

```
写真は5箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率・アングル・湯気やライティングの雰囲気はImage 1に合わせてください。
- トップ中央の大きい丼写真 → Image 2に置き換え
- 人気メニュー1枚目の写真 → Image 3に置き換え
- 人気メニュー2枚目の写真 → Image 4に置き換え
- 人気メニュー3枚目の写真 → Image 5に置き換え
- 右下の店舗外観写真 → Image 6に置き換え

- 左上の店舗ロゴ文字を「{shop_name}」に変更してください。
- トップの見出しコピーを「{headline}」、大見出しを「{title}」、その下の帯コピーを「{sub_copy}」に変更してください。
- 3つのこだわりバッジを「{point_1_title}/{point_1_desc}」「{point_2_title}/{point_2_desc}」「{point_3_title}/{point_3_desc}」に変更してください(アイコン・枠デザインは変更しないでください)。
- 右側の縦帯コピーを「{side_banner_text}」に変更してください。
- 「{checklist_title}」の項目を「{check_1}」〜「{check_5}」に変更してください。
- 人気メニュー3品の名前・価格・説明文を「{item_name_1} {price_1}円 {item_desc_1}」「{item_name_2} {price_2}円 {item_desc_2}」「{item_name_3} {price_3}円 {item_desc_3}」に変更してください。
- お客様の声3件を「{review_1_title}/{review_1_comment}/{review_1_profile}」「{review_2_title}/{review_2_comment}/{review_2_profile}」「{review_3_title}/{review_3_comment}/{review_3_profile}」に変更してください。人物アイコン・星の数のデザインは変更しないでください。
- LINEクーポン帯の文言を「{coupon_text}」に変更してください。
- クーポン帯の3ステップラベルを「{coupon_step_1}」「{coupon_step_2}」「{coupon_step_3}」に変更してください。
- クーポン帯のQRコードをImage 7の顧客QRコードに置き換えてください。
- フッターの営業時間を「{hours}」、定休日を「{holiday}」、電話番号を「{tel}」、住所を「{address}」、駅からのアクセス表記を「{station_access}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 08. line_benefits（LINE友だち追加3特典・グリーン）

**参考画像ファイル:** `references/08_line_benefits.png`

**画像スロット:** Image2=顧客のQRコード画像

**必要な入力項目:** headline_prefix(既定値"友だち追加で"), headline_main(既定値"お得なクーポンプレゼント!"), headline_sub(既定値"うれしい特典がたくさん!"), line_id, benefit_1_text, benefit_2_title, benefit_2_desc, benefit_3_title, benefit_3_desc, step_1_label, step_1_desc, step_2_label, step_2_desc, step_3_label, step_3_desc, bottom_note_1(既定値"さらに!友だち限定の特典も配信中!"), bottom_note_2(既定値"今すぐ登録してお得をゲットしよう!")

**プロンプト**

```
- 上部の見出しを「{headline_prefix}」「{headline_main}」、その下のサブ文言を「{headline_sub}」に変更してください。
- スマホ画面内のQRコードをImage 2に置き換え、LINE IDの表記を「{line_id}」に変更してください。
- 特典1のテキストを「{benefit_1_text}」に変更してください。
- 特典2のタイトルを「{benefit_2_title}」、説明を「{benefit_2_desc}」に変更してください。
- 特典3のタイトルを「{benefit_3_title}」、説明を「{benefit_3_desc}」に変更してください。
- 3ステップ登録案内を「{step_1_label}/{step_1_desc}」「{step_2_label}/{step_2_desc}」「{step_3_label}/{step_3_desc}」に変更してください。
- 下部の案内文を「{bottom_note_1}」「{bottom_note_2}」に変更してください。
- アイコン・イラスト(メガホン、ギフト、キャラクター等)は変更しないでください(装飾イラストのため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。
```

---

## 09. sns_annotation（手描き風・料理写真+吹き出しコメント）

**参考画像ファイル:** `references/09_sns_annotation.png`

**画像スロット:** Image2=顧客の料理写真

**必要な入力項目:** shop_name_label, caption_1〜9

> ⚠️ このテンプレートの吹き出しコメントはラーメン特有の具材を指した文言です。顧客写真がラーメン以外の料理の場合は、写っている具材に合わせてコメント内容を毎回書き換えてください。

**プロンプト**

```
Image 1の背景写真をImage 2の顧客写真に置き換えてください。手描き風の白い線・吹き出し・キラキラ装飾のスタイルはImage 1と完全に同じにしてください。

吹き出しコメントは以下の内容・配置で描いてください(Image 2に写っている具材や見た目に合わせて自然な位置に配置してください)。
- 「{caption_1}」
- 「{caption_2}」
- 「{caption_3}」
- 「{caption_4}」
- 「{caption_5}」
- 「{caption_6}」
- 「{caption_7}」
- 「{caption_8}」
- 「{caption_9}」
- 左下のレシート風ラベルの店名を「{shop_name_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 10. calendar（営業カレンダー）

**参考画像ファイル:** `references/10_calendar.png`

**画像スロット:** Image2=顧客の限定メニュー写真

> ⚠️ 重要な注意: このテンプレートはカレンダーの日付・曜日・特典タグの位置が正確に揃っている必要があり、AI画像生成は数字や細かいグリッドの正確な再現が苦手です。プロンプトだけで完璧に再現しようとせず、「AIには背景の装飾・限定メニュー写真・全体の雰囲気だけ生成させ、カレンダーの日付グリッドと特典タグはHTML/CSSやCanvaなど別の仕組みで正確に描画する」ハイブリッド運用を強くおすすめします。

**必要な入力項目:** shop_name, title_text(既定値"営業カレンダー"), thank_you_note(既定値"いつもご来店ありがとうございます"), year_month, hours, holiday, feature_menu_name, feature_menu_period, day_tags, legend_text, notice_text, footer_note(既定値"皆さまのご来店を心よりお待ちしております!")

**プロンプト**

```
- タイトルを「{title_text}」に変更してください。
- 上部の一言メッセージを「{thank_you_note}」に変更してください。
- 左上の限定メニューサムネイル写真をImage 2の顧客写真に置き換えてください。
- 店舗名を「{shop_name}」、年月表記を「{year_month}」に変更してください。
- 右上の営業時間を「{hours}」、定休日を「{holiday}」に変更してください。
- 限定メニュー名を「{feature_menu_name}」、実施期間を「{feature_menu_period}」に変更してください。
- カレンダー内の日付ごとの特典タグを次の内容で正確に配置してください: {day_tags}(各タグは対応する日付マスの中に収めてください)。
- 下部の凡例を「{legend_text}」に変更してください。
- 下部の予告文を「{notice_text}」に変更してください。
- 最下部の一言メッセージを「{footer_note}」に変更してください。
- カレンダーの曜日の並び・マスの数はImage 1と同じ7列構成を維持し、日付の数字は{year_month}の実際のカレンダー通りに正しく並べてください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。
```

---

## 11. recommend_menu（おすすめメニュー・リーフ柄）

**参考画像ファイル:** `references/11_recommend_menu.png`

**画像スロット:** Image2〜5=写真4枚

**必要な入力項目:** heading, tagline, badge_text, hero_item_name, hero_price, hero_desc, sub_item_1_name, sub_price_1, sub_item_2_name, sub_price_2, sub_item_3_name, sub_price_3, extra_menu_intro(既定値"その他のメニューもご用意しております"), extra_menu_tags, banner_text_1, banner_text_2

**プロンプト**

```
写真は4箇所あります。それぞれ対応するImageに置き換えてください。トリミング比率はImage 1に合わせてください。
- 大きいメイン写真 → Image 2に置き換え
- サブ写真1枚目 → Image 3に置き換え
- サブ写真2枚目 → Image 4に置き換え
- サブ写真3枚目 → Image 5に置き換え

- 見出しを「{heading}」、タグラインを「{tagline}」、右上のバッジを「{badge_text}」に変更してください。
- メイン商品の名前「{hero_item_name}」、価格「{hero_price}円」、説明「{hero_desc}」に変更してください。
- サブ3品の名前・価格を「{sub_item_1_name} {sub_price_1}円」「{sub_item_2_name} {sub_price_2}円」「{sub_item_3_name} {sub_price_3}円」に変更してください。
- タグ一覧の上にある一言を「{extra_menu_intro}」に変更してください。
- 下部のタグ一覧を「{extra_menu_tags}」に変更してください。
- バナー2つを「{banner_text_1}」「{banner_text_2}」に変更してください(バナーの色・形状は変更しないでください)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。
```

---

## 12. spring_sale（春の感謝祭 20%OFF・桜柄）

**参考画像ファイル:** `references/12_spring_sale.png`

**画像スロット:** Image2〜5=写真4枚

**必要な入力項目:** badge_text, title, subtitle, discount_rate, date_range, desc_text, item_name_1, original_price_1, sale_price_1, item_name_2, original_price_2, sale_price_2, item_name_3, original_price_3, sale_price_3, footer_text

**プロンプト**

```
写真は4箇所あります。それぞれ対応するImageに置き換えてください。
- 右側の大きい丼写真 → Image 2に置き換え
- 下部の商品写真1枚目 → Image 3に置き換え
- 下部の商品写真2枚目 → Image 4に置き換え
- 下部の商品写真3枚目 → Image 5に置き換え

- 上部の赤い帯バッジを「{badge_text}」、大見出しを「{title}」、右上の吹き出しを「{subtitle}」に変更してください。
- 割引率の大きな数字を「{discount_rate}」に変更してください。
- 期間表記を「{date_range}」に変更してください。
- 説明文を「{desc_text}」に変更してください。
- 下部3品の名前・通常価格・割引後価格を「{item_name_1} {original_price_1}円→{sale_price_1}円」「{item_name_2} {original_price_2}円→{sale_price_2}円」「{item_name_3} {original_price_3}円→{sale_price_3}円」に変更してください。
- 下部の締めのコピーを「{footer_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。
```

---

## 13. single_item_dark（単品広告・黒背景）

**参考画像ファイル:** `references/13_single_item_dark.png`

**画像スロット:** Image2=顧客写真

**必要な入力項目:** badge_text, catch_copy, desc_text, item_name, price, feature_1_title, feature_1_desc, feature_2_title, feature_2_desc, feature_3_title, feature_3_desc

**プロンプト**

```
- 中央〜右の写真をImage 2の顧客写真に置き換えてください。
- 左上のバッジを「{badge_text}」、大見出しコピーを「{catch_copy}」に変更してください。
- 左側の説明文を「{desc_text}」に変更してください。
- 商品名を「{item_name}」、価格を「{price}円」に変更してください。
- 下部の3つの特徴丸バッジを「{feature_1_title}/{feature_1_desc}」「{feature_2_title}/{feature_2_desc}」「{feature_3_title}/{feature_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は正方形(1:1)、高解像度でお願いします。
```

---

## 14. smoothie_single（MIX SMOOTHIE・単品訴求）

**参考画像ファイル:** `references/14_smoothie_single.png`

**画像スロット:** Image2=商品写真／Image3=ブランドロゴ画像(任意)

**必要な入力項目:** callout_text, new_badge_text, title_en_1(既定値"MIX"), title_en_2(既定値"SMOOTHIE"), title_jp, period_badge_label(既定値"期間限定"), start_date, start_weekday, start_label(既定値"START!"), use_logo_image(true/false), brand_name, brand_tagline(use_logo_imageがfalseの時のみ使用), flavor_title, ingredient_1〜3, bottom_badge_text, size_label, price, takeout_label(既定値"テイクアウトOK!")

**プロンプト**

```
- 中央のスムージー写真をImage 2の顧客写真に置き換えてください。周囲のフルーツの飛沫演出やライティングの雰囲気はImage 1に合わせてください。
- 上部の手描き風の一言を「{callout_text}」に変更してください。
- 黄色い丸バッジの文言を「{new_badge_text}」に変更してください。
- 大見出しを「{title_en_1}」「{title_en_2}」、その下のカタカナ表記を「{title_jp}」に変更してください。
- 緑の丸バッジを「{period_badge_label}」「{start_date}」「{start_weekday}」「{start_label}」に変更してください。
- 【ロゴ画像あり版】カップに貼られた丸いブランドシールを、Image 3のロゴ画像にそのまま置き換えてください。シールの円形の縁取り・カップへの貼り付き方(曲面に沿ったなじみ方)はImage 1と同じにしてください。
- 【ロゴ画像なし版】カップに貼られた丸いブランドシールの文字を「{brand_name}」「{brand_tagline}」に変更してください(シールのイラスト・配置スタイルはImage 1のまま維持してください)。
- 右側の白いメモ風ボックスのタイトルを「{flavor_title}」、チェックリスト3項目を「{ingredient_1}」「{ingredient_2}」「{ingredient_3}」に変更してください。
- 左下のピンク丸バッジを「{bottom_badge_text}」に変更してください。
- 右下の価格バッジを「{size_label}」「{price}円(税込)」に変更してください。
- 下部のリボンを「{takeout_label}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 15. smoothie_trio（ごろっとフルーツスムージー・3種展開）

**参考画像ファイル:** `references/15_smoothie_trio.png`

**画像スロット:** Image2〜4=3種のスムージー写真(左から順)

**必要な入力項目:** callout_text, new_badge_text, title_line_1(既定値"ごろっと"), title_line_2(既定値"フルーツ"), title_line_3(既定値"スムージー"), period_badge_label, start_date, start_weekday, start_label, flavor_1_name, flavor_2_name, flavor_3_name, size_label, price, sub_catch, feature_1_title, feature_1_desc, feature_2_title, feature_2_desc, feature_3_title, feature_3_desc

**プロンプト**

```
写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 左側のスムージー写真 → Image 2に置き換え
- 中央のスムージー写真 → Image 3に置き換え
- 右側のスムージー写真 → Image 4に置き換え

- 上部の手描き風の一言を「{callout_text}」に変更してください。
- 吹き出しバッジの文言を「{new_badge_text}」に変更してください。
- 大見出しを「{title_line_1}」「{title_line_2}」「{title_line_3}」に変更してください。
- 黄色い丸バッジを「{period_badge_label}」「{start_date}」「{start_weekday}」「{start_label}」に変更してください。
- 各カップに貼られた丸いシールの文字を、左から「{flavor_1_name}」「{flavor_2_name}」「{flavor_3_name}」に変更してください(シールのイラスト・アイコンは変更しないでください)。
- 左下の価格バッジを「{size_label}」「{price}円」「税込」に変更してください。
- 中央下部の手描き下線付きコピーを「{sub_catch}」に変更してください。
- 下部の3つの特徴アイコンを「{feature_1_title}/{feature_1_desc}」「{feature_2_title}/{feature_2_desc}」「{feature_3_title}/{feature_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 16. veggie_focaccia_poster（ローストベジフォカッチャ・英語ポスター）

**参考画像ファイル:** `references/16_veggie_focaccia_poster.png`

**画像スロット:** Image2=商品写真(サンドイッチ+副菜)

**必要な入力項目:** title_line_1(既定値"ROASTED VEGGIE"), title_line_2(既定値"FOCACCIA"), location_name(既定値"KOBE HARBOR"), tagline(既定値"A BRIGHT, CRUNCHY SANDWICH MADE FOR LUNCH."), hours, holiday

**プロンプト**

```
- 背景の商品写真をImage 2の顧客写真に置き換えてください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- その下の地名/店舗名を「{location_name}」に変更してください。
- キャッチコピーを「{tagline}」に変更してください。
- 下部の営業時間を「{hours}」、定休日を「{holiday}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 17. ingredient_diagram_sandwich（具材ラベル付きサンドイッチ図解）

**参考画像ファイル:** `references/17_ingredient_diagram_sandwich.png`

**画像スロット:** Image2=商品写真(断面が見える食品写真)

> ⚠️ 注意: このテンプレートは引き出し線で写真内の各層(パン/ソース/具材...)を指し示す構造です。顧客写真の具材の重なり順や層の数が参考画像と異なる場合、ラベルの文言だけでなく引き出し線の指す位置も調整が必要です。

**必要な入力項目:** title_line_1, title_line_2, ingredient_1〜7(引き出し線で指す上から順のラベル)

**プロンプト**

```
- 商品写真をImage 2の顧客写真に置き換えてください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- 引き出し線のラベルを上から順に「{ingredient_1}」「{ingredient_2}」「{ingredient_3}」「{ingredient_4}」「{ingredient_5}」「{ingredient_6}」「{ingredient_7}」に変更し、Image 2で対応する層を指すように引き出し線の位置を調整してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(3:5程度)、高解像度でお願いします。
```

---

## 18. strawberry_milk_kakigori（苺みるくかき氷）

**参考画像ファイル:** `references/18_strawberry_milk_kakigori.png`

**画像スロット:** Image2=商品写真

**必要な入力項目:** title_jp, subtitle_jp, title_en_script, badge_text(既定値"季節限定"), price

**プロンプト**

```
- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 毛筆体の大見出しを「{title_jp}」に変更してください。
- その下のサブタイトルを「{subtitle_jp}」に変更してください。
- スクリプト体の英語表記を「{title_en_script}」に変更してください。
- 下部のバッジを「{badge_text}」、価格を「{price}円」に変更してください。
- 和柄の装飾パターンは変更しないでください(装飾のため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 19. strawberry_pistachio_crepe（ストロベリーピスタチオクレープ）

**参考画像ファイル:** `references/19_strawberry_pistachio_crepe.png`

**画像スロット:** Image2=商品写真

**必要な入力項目:** label_left(既定値"CREPE"), label_right(既定値"SEASONAL"), title_line_1, title_line_2, subtitle_script, desc_text

**プロンプト**

```
- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 左上のラベルを「{label_left}」、右上のラベルを「{label_right}」に変更してください。
- 大見出しを「{title_line_1}」「{title_line_2}」に変更してください。
- スクリプト体のサブタイトルを「{subtitle_script}」に変更してください。
- 左下の説明文を「{desc_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 20. bakery_opening_day（ベーカリーOPEN告知・イラスト版）

**参考画像ファイル:** `references/20_bakery_opening_day.png`

**画像スロット:** なし(実写を使わず、イラストのみで構成)

**必要な入力項目:** business_genre(業種。例:"ベーカリー"/"カフェ"/"ケーキ店"/"和菓子店" — イラストの題材と雰囲気の方向性を決めるために使用), logo_icon_desc(既定値"三角屋根の小さな家のアイコン"。業種に合わせて例:"コーヒーカップのアイコン"、"ケーキスタンドのアイコン"等に変更可), corner_illustration_1〜5(コーナー装飾イラストの題材。既定値はクロワッサン/丸パン/編み込みパン/デニッシュ/食パン。業種が違う場合は例:カフェなら"コーヒー豆"「ドリップポット」「マグカップ」「ラテアート」「コーヒー缶」、ケーキ店なら"ホールケーキ"「カップケーキ」「マカロン」「タルト」「クッキー」等に差し替え), shop_name(既定値"Sunny Hearth"), shop_name_sub(既定値"BAKERY"), title_text(既定値"BAKERY OPENING DAY"), event_date, event_hours, offer_1_badge(既定値"先着100名様"), offer_1_title(既定値"焼きたてパンプレゼント"), offer_1_desc, offer_2_badge(既定値"数量限定"), offer_2_title(既定値"限定セット"), offer_2_price, offer_2_desc, feature_1〜4, access_label(既定値"アクセス"), shop_catch, shop_desc, footer_note(既定値"皆さまのご来店を心よりお待ちしております!")

> ※このテンプレートは写真を使わないので、業種を変える時の主な差し替え箇所は「イラストの題材」になります。business_genreで全体の方向性を指定した上で、logo_icon_descとcorner_illustration_1〜5で具体的に何を描くかを指定してください。花・葉・水玉などの純粋な背景装飾はジャンルに関わらず共通のままにしています。

**プロンプト**

```
このテンプレートは実写を使わず、Image 1と同じ手描き風イラストのタッチ・パステルカラーの配色・装飾フレームのスタイルで構成してください。今回の業種は「{business_genre}」です。

- 中央上部のロゴアイコンを「{logo_icon_desc}」の絵柄に変更してください(Image 1と同じ線画タッチ・配色で描いてください)。ロゴ横のテキストを「{shop_name}」「{shop_name_sub}」に変更してください。
- 四隅のコーナー装飾イラストを、Image 1と同じ配置・同じ手描きタッチのまま、それぞれ「{corner_illustration_1}」「{corner_illustration_2}」「{corner_illustration_3}」「{corner_illustration_4}」「{corner_illustration_5}」の絵柄に変更してください。
- 大見出しを「{title_text}」に変更してください。
- 日付を「{event_date}」、営業時間を「{event_hours}」に変更してください。
- 特典ボックス1を「{offer_1_badge}」「{offer_1_title}」「{offer_1_desc}」に変更してください。
- 特典ボックス2を「{offer_2_badge}」「{offer_2_title}」「{offer_2_price}円」「{offer_2_desc}」に変更してください。
- 4つの特徴バッジを「{feature_1}」「{feature_2}」「{feature_3}」「{feature_4}」に変更してください(バッジ内の小さなアイコンは、対応する文言の内容に合わせて自然に描き変えてください)。
- 左下のアクセス欄のラベルを「{access_label}」に変更してください。地図イラストは簡略化された図のまま、実際の道路の正確な再現は不要です。
- 右側の店舗紹介を「{shop_name}」「{shop_catch}」「{shop_desc}」に変更してください。
- 最下部の一言を「{footer_note}」に変更してください。
- 花・葉・水玉などの背景装飾は変更しないでください(業種に関わらず共通の装飾のため)。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 21. new_open_690_campaign（NEW OPEN 690円均一キャンペーン）

**参考画像ファイル:** `references/21_new_open_690_campaign.png`

**画像スロット:** Image2〜4=写真3枚(左から順)

**必要な入力項目:** top_banner_text(既定値"皆さまのご来店をお待ちしています!"), badge_text(既定値"OPEN記念"), period_label(既定値"7日間限定!"), price(既定値"690"), campaign_period, campaign_conditions, item_1_comment, item_1_name, item_2_comment, item_2_name, item_3_comment, item_3_name, shop_tagline(既定値"美味しい時間を、もっと身近に。"), shop_name, shop_desc, notice_text

**プロンプト**

```
写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 左側の商品写真 → Image 2に置き換え
- 中央の商品写真 → Image 3に置き換え
- 右側の商品写真 → Image 4に置き換え

- 上部の帯を「NEW OPEN!」「{top_banner_text}」に変更してください。
- 右上の丸バッジを「{badge_text}」に変更してください。
- 「{period_label}」の表記を変更してください。
- 中央の大きな価格数字を「{price}」に変更してください。
- キャンペーン期間を「{campaign_period}」、利用条件を「{campaign_conditions}」に変更してください。
- 3品それぞれの吹き出しコメントと商品名を「{item_1_comment}」/「{item_1_name}」、「{item_2_comment}」/「{item_2_name}」、「{item_3_comment}」/「{item_3_name}」に変更してください(価格は{price}円で統一)。
- フッターのキャッチコピーを「{shop_tagline}」、店舗名を「{shop_name}」、説明文を「{shop_desc}」に変更してください。
- 下部の案内文を「{notice_text}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 22. weekend_brunch_plate（週末ブランチ・選べるプレート）

**参考画像ファイル:** `references/22_weekend_brunch_plate.png`

**画像スロット:** Image2〜4=写真3枚(左から順)

**必要な入力項目:** item_1_name(既定値"EGG"), item_1_price, item_1_desc, item_2_name(既定値"SALAD"), item_2_price, item_2_desc, item_3_name(既定値"PANCAKE"), item_3_price, item_3_desc, section_title_en(既定値"WEEKEND BRUNCH"), section_title_jp(既定値"選べるプレート"), drink_list(改行区切りのドリンク一覧), topping_list(改行区切りのトッピング一覧), drink_set_desc, sweet_set_price(既定値"+300円"), sweet_set_desc

**プロンプト**

```
写真は3箇所あります。それぞれ対応するImageに置き換えてください。
- 1品目の写真 → Image 2に置き換え
- 2品目の写真 → Image 3に置き換え
- 3品目の写真 → Image 4に置き換え

- 3品の名前・価格・説明文を「{item_1_name} {item_1_price}円 {item_1_desc}」「{item_2_name} {item_2_price}円 {item_2_desc}」「{item_3_name} {item_3_price}円 {item_3_desc}」に変更してください。
- セクションタイトルを「{section_title_en}」「{section_title_jp}」に変更してください。
- セットドリンクの一覧を次の内容に変更してください: {drink_list}
- 追加トッピングの一覧を次の内容に変更してください: {topping_list}
- DRINK SETボックスの説明を「{drink_set_desc}」に変更してください。
- SWEET SETボックスの価格を「{sweet_set_price}」、説明を「{sweet_set_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 23. yakitori_menu（炭火串焼きMENU）

**参考画像ファイル:** `references/23_yakitori_menu.png`

**画像スロット:** Image2=上部の串焼き集合写真／Image3〜7=5種の串写真(もも肉系/つくね系/ささみ系/うずら系/しいたけ系)／Image8=鶏だし茶漬け写真／Image9=焼きおにぎり写真

**必要な入力項目:** category_tag(既定値"串火"), menu_label(既定値"MENU"), item_1_name(既定値"もも ねぎま"), item_1_price(280), item_2_name(既定値"つくね(たれ・月見)"), item_2_price(320), item_3_name(既定値"ささみおろしポン酢"), item_3_price(300), item_4_name(既定値"砂肝"), item_4_price(260), item_5_name(既定値"うずら玉子"), item_5_price(240), item_6_name(既定値"皮(パリパリ)"), item_6_price(220), item_7_name(既定値"ぼんじり"), item_7_price(280), item_8_name(既定値"しいたけ"), item_8_price(240), extra_1_name(既定値"鶏だし茶漬け"), extra_1_price(380), extra_2_name(既定値"焼きおにぎり"), extra_2_price(280)

**プロンプト**

```
写真は8箇所あります。それぞれ対応するImageに置き換えてください。
- 上部の串焼き集合写真 → Image 2に置き換え
- {item_1_name}の串写真 → Image 3に置き換え
- {item_2_name}の串写真 → Image 4に置き換え
- {item_3_name}の串写真 → Image 5に置き換え
- {item_5_name}の串写真 → Image 6に置き換え
- {item_8_name}の串写真 → Image 7に置き換え
- {extra_1_name}の写真 → Image 8に置き換え
- {extra_2_name}の写真 → Image 9に置き換え

- 左上のカテゴリ表記を「{category_tag}」、その下を「{menu_label}」に変更してください。
- 品目リストを「{item_1_name} {item_1_price}円」「{item_2_name} {item_2_price}円」「{item_3_name} {item_3_price}円」「{item_4_name} {item_4_price}円」「{item_5_name} {item_5_price}円」「{item_6_name} {item_6_price}円」「{item_7_name} {item_7_price}円」「{item_8_name} {item_8_price}円」に変更してください。
- 下部の追加メニュー2品を「{extra_1_name} {extra_1_price}円」「{extra_2_name} {extra_2_price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 24. colorful_bowl_lunch（選べる彩りボウル）

**参考画像ファイル:** `references/24_colorful_bowl_lunch.png`

**画像スロット:** Image2〜5=写真4枚(左上/右上/左下/右下の順)

**必要な入力項目:** item_1_name, item_2_name, item_3_name, item_4_name, banner_title(既定値"選べる彩りボウル"), banner_badge(既定値"ランチ限定"), price

**プロンプト**

```
写真は4箇所あります。それぞれ対応するImageに置き換えてください。
- 左上の写真 → Image 2に置き換え
- 右上の写真 → Image 3に置き換え
- 左下の写真 → Image 4に置き換え
- 右下の写真 → Image 5に置き換え

- 4品の名前を左上から順に「{item_1_name}」「{item_2_name}」「{item_3_name}」「{item_4_name}」に変更してください(色タグの配色は変更しないでください)。
- 中央バナーのタイトルを「{banner_title}」、バッジを「{banner_badge}」、価格を「{price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 25. teppan_gyoza_menu（鉄板ぎょうざメニュー）

**参考画像ファイル:** `references/25_teppan_gyoza_menu.png`

**画像スロット:** Image2=メイン写真(鉄板ぎょうざ)

**必要な入力項目:** category_tag(既定値"香ばし餃子"), title_text(既定値"鉄板ぎょうざ"), subtitle_text(既定値"外はパリッと中はジューシー!"), takeout_badge(既定値"持ち帰りできます"), type_1_name(既定値"焼き餃子"), type_1_qty(既定値"8個"), type_1_price(720), type_1_desc, type_2_label(既定値"しそ"), type_2_name(既定値"しそ餃子"), type_2_qty(既定値"8個"), type_2_price(780), type_2_desc, commitment_title(既定値"こだわりの餃子"), commitment_1〜3, sauce_1_name(既定値"定番醤油ダレ"), sauce_1_desc, sauce_2_name(既定値"さっぱり柚子ダレ"), sauce_2_desc, sauce_3_name(既定値"ピリ辛ラー油ダレ"), sauce_3_desc, sauce_4_name(既定値"まろやか味噌ダレ"), sauce_4_desc, sauce_5_name(既定値"塩ダレ"), sauce_5_desc, topping_1_name(既定値"半熟味玉"), topping_1_price(120), topping_2_name(既定値"ねぎ増し"), topping_2_price(100), topping_3_name(既定値"メンマ"), topping_3_price(100), topping_4_name(既定値"大葉増し"), topping_4_price(100), addon_note(既定値"焼き餃子・しそ餃子各種"), addon_price(360), step_1_label(既定値"注文する"), step_1_desc, step_2_label(既定値"受け取る"), step_2_desc, step_3_label(既定値"おうちで楽しむ"), step_3_desc, reheat_pan_desc, reheat_microwave_desc, bottom_badge_1_title(既定値"スマホから簡単注文"), bottom_badge_1_desc, bottom_badge_2_title(既定値"まとめて注文OK"), bottom_badge_2_desc, bottom_badge_3_title(既定値"店頭受取"), bottom_badge_3_desc

**プロンプト**

```
- メイン写真をImage 2の顧客写真に置き換えてください。
- 左上のカテゴリタグを「{category_tag}」、大見出しを「{title_text}」に変更してください。
- サブタイトルを「{subtitle_text}」、持ち帰りバッジを「{takeout_badge}」に変更してください。
- 2つの餃子タイプボックスを「{type_1_name} {type_1_qty} {type_1_price}円 {type_1_desc}」「{type_2_label}/{type_2_name} {type_2_qty} {type_2_price}円 {type_2_desc}」に変更してください。
- 「{commitment_title}」の3項目を「{commitment_1}」「{commitment_2}」「{commitment_3}」に変更してください。
- 選べるタレ5種を「{sauce_1_name}/{sauce_1_desc}」「{sauce_2_name}/{sauce_2_desc}」「{sauce_3_name}/{sauce_3_desc}」「{sauce_4_name}/{sauce_4_desc}」「{sauce_5_name}/{sauce_5_desc}」に変更してください(アイコンの配色は変更しないでください)。
- トッピング4種を「{topping_1_name} +{topping_1_price}円」「{topping_2_name} +{topping_2_price}円」「{topping_3_name} +{topping_3_price}円」「{topping_4_name} +{topping_4_price}円」に変更してください。
- 追加料金ボックスを「{addon_note} 追加+{addon_price}円」に変更してください。
- お持ち帰りの流れ3ステップを「{step_1_label}/{step_1_desc}」「{step_2_label}/{step_2_desc}」「{step_3_label}/{step_3_desc}」に変更してください。
- 温め直し方を「フライパン:{reheat_pan_desc}」「電子レンジ:{reheat_microwave_desc}」に変更してください。
- 下部3つのバッジを「{bottom_badge_1_title}/{bottom_badge_1_desc}」「{bottom_badge_2_title}/{bottom_badge_2_desc}」「{bottom_badge_3_title}/{bottom_badge_3_desc}」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力はA4縦相当のアスペクト比、高解像度でお願いします。
```

---

## 26. charcoal_saba_ju（炭火香るさば重）

**参考画像ファイル:** `references/26_charcoal_saba_ju.png`

**画像スロット:** Image2=商品写真

**必要な入力項目:** title_text(既定値"炭火香るさば重"), desc_text_1, desc_text_2, desc_text_3, serving_tip_title(既定値"おすすめのお召し上がり方"), serving_tip_desc, badge_text(既定値"季節限定"), hours, price

**プロンプト**

```
- 中央の商品写真をImage 2の顧客写真に置き換えてください。
- 中央の大見出しを「{title_text}」に変更してください。
- 右上の説明文を「{desc_text_1}」、その下のキャッチを「{desc_text_2}」に変更してください。
- 左側の説明文を「{desc_text_3}」に変更してください。
- 「{serving_tip_title}」の説明を「{serving_tip_desc}」に変更してください。
- 右側の丸バッジを「{badge_text}」に変更してください。
- 下部バーの営業時間を「{hours}」、価格を「{price}円」に変更してください。
- Image 1にない装飾・ロゴ・文字は追加しないでください。
- 出力は縦長(4:5程度)、高解像度でお願いします。
```

---

## 実装メモ

- QRコード・ロゴ画像も、写真と同じく「画像パーツ」としてそのままAPIに渡せます。コード側では `customer_photos`(写真・QR・ロゴをまとめたリスト)を各テンプレートの画像スロットの順番通りに並べて渡してください。
- `smoothie_single` のロゴ画像のように「任意」のスロットがあるテンプレートは、`use_logo_image` のようなフラグで画像の有無を判定し、ある場合だけその画像をリストに追加し、プロンプト文中の該当の指示行(【ロゴ画像あり版】/【ロゴ画像なし版】)を出し分けてください。
- 10番(calendar)は日付グリッドの精度が理由で、AI画像生成だけに頼らずハイブリッド運用(カレンダー部分は別の仕組みで描画)を推奨します。
- 9番(sns_annotation)は吹き出しコメントの内容が料理の具材に依存するため、顧客写真の内容に合わせて毎回文言を調整してください。

**今後の運用:** 新しい参考画像を追加する際は、この文書に「27. ○○」という形で追記していきます（別ファイルには分散させない）。
