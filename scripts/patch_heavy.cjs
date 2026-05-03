const fs = require('fs');

// Patch api.ts
let api = fs.readFileSync('src/lib/api.ts', 'utf-8');
api = api.replace(/guideData\.content = "";/g, "delete (guideData as any).content;");
api = api.replace(/guideData\.markdown = "";/g, "delete (guideData as any).markdown;");
api = api.replace(/guideData\.html_content = "";/g, "delete (guideData as any).html_content;");
api = api.replace(/guideData\.css_content = "";/g, "delete (guideData as any).css_content;");

api = api.replace(/if \(updates\.content !== undefined\) updates\.content = "";/g, "if (updates.content !== undefined) delete (updates as any).content;");
api = api.replace(/if \(updates\.markdown !== undefined\) updates\.markdown = "";/g, "if (updates.markdown !== undefined) delete (updates as any).markdown;");
api = api.replace(/if \(updates\.html_content !== undefined\) updates\.html_content = "";/g, "if (updates.html_content !== undefined) delete (updates as any).html_content;");
api = api.replace(/if \(updates\.css_content !== undefined\) updates\.css_content = "";/g, "if (updates.css_content !== undefined) delete (updates as any).css_content;");
fs.writeFileSync('src/lib/api.ts', api);

// Patch supabase.ts
let sbase = fs.readFileSync('src/lib/supabase.ts', 'utf-8');
sbase = sbase.replace(/html_code:\s*component\.html_code,/g, "// html_code: heavy fields removed");
sbase = sbase.replace(/css_code:\s*component\.css_code,/g, "// css_code: heavy fields removed");
sbase = sbase.replace(/js_code:\s*component\.js_code,/g, "// js_code: heavy fields removed");
sbase = sbase.replace(/react_files:\s*component\.react_files\s*\|\|\s*\[\],/g, "// react_files: heavy fields removed");

sbase = sbase.replace(/if \(fields\.html_code !== undefined\) updatePayload\.html_code = fields\.html_code;/g, "");
sbase = sbase.replace(/if \(fields\.css_code !== undefined\) updatePayload\.css_code = fields\.css_code;/g, "");
sbase = sbase.replace(/if \(fields\.js_code !== undefined\) updatePayload\.js_code = fields\.js_code;/g, "");
sbase = sbase.replace(/if \(fields\.react_files !== undefined\) updatePayload\.react_files = fields\.react_files;/g, "");

fs.writeFileSync('src/lib/supabase.ts', sbase);
console.log("Patched API files to avoid sending heavy data to Supabase");
