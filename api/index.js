const express = require("express");
const axios = require("axios");
const app = express("localhost", 3000);
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
dotenv.config();
const key = process.env.key;
app.use(express.json());
app.post(
  "/",
  [
    body("no")
      .isString()
      .withMessage("Field must be a string")
      .matches(/^[A-Z]{2}\d{2}-\d{4}\d{7}$/)
      .withMessage("Field must match the format SS-RRYYYYNNNNNNN"),
    body("dob")
      .isString()
      .withMessage("filed must be string")
      .matches(/^\d{2}-\d{2}-\d{4}$/)
      .withMessage("Field mus be of the format DD-MM-YYYY"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      var auth = req.body.auth;
      var no = req.body.no;
      var dob = req.body.dob;

      if (!auth || auth != key) {
        return res.status(401).send("Unauthorized");
      }
      const response = await axios.post(
        "https://parivahan.gov.in/rcdlstatus/?pur_cd=101"
      );

      const pattern =
        /<input type="hidden" name="javax.faces.ViewState" id="j_id1:javax.faces.ViewState:0" value="([^"]*)" autocomplete="off" \/>/;
      const pattern2 = /jsessionid=([^?]+)\?ln=images/;
      const pattern3 =
        /s:&quot;([^&]+)&quot;,u:&quot;form_rcdl:pnl_show form_rcdl:pg_show/;
      const data = String(response.data);
      const match = data.match(pattern);
      const match2 = data.match(pattern2);
      const match3 = data.match(pattern3);
      console.log(match[1]);
      console.log(match2[1]);
      console.log(match3[1]);
      var scheme = {
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": match3[1],
        "javax.faces.partial.execute": "@all",
        "javax.faces.partial.render":
          "form_rcdl:pnl_show form_rcdl:pg_show form_rcdl:rcdl_pnl",

        form_rcdl: "form_rcdl",
        // "form_rcdl:tf_dlNO": "BR38-20230003119",
        "form_rcdl:tf_dlNO": no,
        // "form_rcdl:tf_dob_input": "04-12-2002",
        "form_rcdl:tf_dob_input": dob,
        // "form_rcdl:j_idt31:CaptchaID": "y6adr",
        "javax.faces.ViewState": match[1],
      };
      scheme[match3[1]] = match3[1];
      const response2 = await axios.post(
        "https://parivahan.gov.in/rcdlstatus/vahan/rcDlHome.xhtml",
        new URLSearchParams(scheme),
        {
          headers: {
            accept: "application/xml, text/xml, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            cookie: "JSESSIONID=" + match2[1],
            "faces-request": "partial/ajax",
            origin: "https://parivahan.gov.in",
            priority: "u=1, i",
            referer: "https://parivahan.gov.in/rcdlstatus/vahan/rcDlHome.xhtml",
            "sec-ch-ua":
              '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "x-requested-with": "XMLHttpRequest",
          },
        }
      );
      const status =
        /<td style="width: 20%;"><span class="font-bold">Current Status<\/span><\/td>\s*<td><span class="">([^<]+)<\/span><\/td>/;
      const statusmatch = String(response2.data).match(status);
      if (statusmatch == null) {
        console.log("invalid or wrong DL");
        return res.status(200).json("wrong or inavlid dl");
      } else {
        console.log(statusmatch[1]);
        return res.status(200).json("active dl");
      }
    } catch (e) {
      return res.status(500).json("Internal server error");
    }
  }
);
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
