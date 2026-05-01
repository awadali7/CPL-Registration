var SPREADSHEET_ID = "1Rw8i4zYDRe-pMwNxffKok4WDWgoSfoE2FHT_af04idI";
var DRIVE_FOLDER_ID = "1pg8L1bZb4vX-9OOpqV7BmafpsmJyVvgD";

function doPost(e) {
  try {
    var name        = e.parameter.name        || "";
    var email       = e.parameter.email       || "";
    var phoneNumber = e.parameter.phoneNumber || "";
    var position    = e.parameter.position    || "";
    var age         = e.parameter.age         || "";
    var photoBase64 = e.parameter.photo       || "";

    // ── Upload photo to Drive ──────────────────────────────────────────────
    var photoUrl = "";
    if (photoBase64) {
      var base64Data = photoBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      var blob = Utilities.newBlob(
        Utilities.base64Decode(base64Data),
        "image/jpeg",
        name.replace(/\s+/g, "_") + "_" + Date.now() + ".jpg"
      );
      var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      var file   = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoUrl = "https://drive.google.com/uc?id=" + file.getId();
    }

    // ── Write to Spreadsheet ───────────────────────────────────────────────
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Age", "Phone Number", "Position", "Photo URL"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#1e7e34").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Calcutta" }),
      name,
      email,
      age,
      phoneNumber,
      position,
      photoUrl,
    ]);

    // ── Send Confirmation Email ────────────────────────────────────────────
    if (email) {
      var positionFull = getPositionFullName(position);
      var html = buildEmailHtml(name, age, phoneNumber, position, positionFull, photoUrl);
      MailApp.sendEmail({
        to: email,
        subject: "✅ CPL 2026 Registration Confirmed – " + name,
        htmlBody: html,
        name: "Chennarathadam Premier League"
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, photoUrl: photoUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getPositionFullName(code) {
  var map = {
    GK: "Goalkeeper", CB: "Center Back", RB: "Right Back", LB: "Left Back",
    CDM: "Central Defensive Midfielder", CM: "Central Midfielder",
    CAM: "Central Attacking Midfielder", RW: "Right Winger",
    LW: "Left Winger", CF: "Center Forward"
  };
  return map[code] || code;
}

function buildEmailHtml(name, age, phone, posCode, posFull, photoUrl) {
  var photoSection = photoUrl
    ? '<img src="' + photoUrl + '" alt="Player Photo" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid #eab308;display:block;margin:0 auto 16px;" />'
    : '<div style="width:80px;height:80px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">⚽</div>';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:24px 0;">'
    + '<tr><td align="center">'
    + '<table width="100%" style="max-width:520px;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">'

    // Header
    + '<tr><td style="background:linear-gradient(135deg,#14532d,#166534);padding:32px 24px;text-align:center;">'
    + '<div style="font-size:13px;color:#86efac;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">Chennarathadam Premier League</div>'
    + '<div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:1px;">SEASON 2026</div>'
    + '<div style="margin-top:10px;display:inline-block;background:#eab308;color:#14532d;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">Registration Confirmed</div>'
    + '</td></tr>'

    // Body
    + '<tr><td style="padding:32px 24px;text-align:center;">'
    + photoSection
    + '<div style="font-size:22px;font-weight:800;color:#ffffff;margin-bottom:4px;">Welcome, ' + name + '!</div>'
    + '<div style="font-size:14px;color:#9ca3af;margin-bottom:28px;">You\'re officially registered for CPL 2026. We\'ll be in touch soon with more details.</div>'

    // Details card
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#1f2937;border-radius:12px;overflow:hidden;text-align:left;margin-bottom:28px;">'
    + buildRow("🧑 Name", name, true)
    + buildRow("📅 Age", age + " years", false)
    + buildRow("📞 Phone", phone, true)
    + buildRow("⚽ Position", posCode + " &mdash; " + posFull, false)
    + '</table>'

    // CTA
    + '<div style="font-size:13px;color:#6b7280;">Questions? Follow us on Instagram</div>'
    + '<a href="https://www.instagram.com/chennarathadampremierleague" style="display:inline-block;margin-top:12px;background:linear-gradient(135deg,#7c3aed,#ec4899,#eab308);color:#fff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:10px;text-decoration:none;">@chennarathadampremierleague</a>'
    + '</td></tr>'

    // Footer
    + '<tr><td style="background:#0f172a;padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">'
    + '<div style="font-size:11px;color:#4b5563;">© 2026 Chennarathadam Premier League. All Rights Reserved.</div>'
    + '</td></tr>'

    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

function buildRow(label, value, shaded) {
  var bg = shaded ? "background:#263244;" : "background:#1f2937;";
  return '<tr style="' + bg + '">'
    + '<td style="padding:12px 16px;font-size:12px;color:#9ca3af;width:40%;">' + label + '</td>'
    + '<td style="padding:12px 16px;font-size:13px;color:#ffffff;font-weight:600;">' + value + '</td>'
    + '</tr>';
}

// Health check + phone lookup
function doGet(e) {
  if (e && e.parameter && e.parameter.phone) {
    var phone = e.parameter.phone.trim();
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      // Columns: Timestamp(1) Name(2) Email(3) Age(4) Phone(5) Position(6) PhotoURL(7)
      var rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][4]).trim() === phone) {
          return ContentService
            .createTextOutput(JSON.stringify({
              exists: true,
              data: {
                name:     rows[i][1],
                email:    rows[i][2],
                age:      String(rows[i][3]),
                position: rows[i][5],
                photoUrl: rows[i][6]
              }
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ exists: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "CPL Registration Script is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}
