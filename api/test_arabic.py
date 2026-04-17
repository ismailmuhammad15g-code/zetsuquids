import sys
sys.path.insert(0, 'D:\\new\\zetsuquids\\api')

from generate-pdf import create_pdf

result = create_pdf({
    'title': 'اختبار العربية',
    'content': '''# مقدمة في MongoDB

MongoDB هو قاعدة بيانات NoSQL تعتمد على المستندات.

## المميزات

- مرونة في تخزين البيانات
- دعم كبير للبيانات الضخمة
- سهولة في التوسع

### النقاط الرئيسية

1. **السرعة**: MongoDB سريعة جداً
2. **المرونة**: يمكن تخزين أي نوع من البيانات
3. **التوسع**: تدعم التوسع الأفقي

## الخاتمة

MongoDB هي خيار ممتاز للتطبيقات الحديثة.''',
    'publisher_name': 'أحمد'
})

with open('D:\\new\\zetsuquids\\api\\test_arabic.pdf', 'wb') as f:
    f.write(result)

print('PDF created! Size:', len(result), 'bytes')