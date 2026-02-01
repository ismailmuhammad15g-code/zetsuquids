// اختبار الدوال الجديدة
const testNewAPIEndpoints = async () => {
    const baseURL = 'http://localhost:3001/api';
    
    console.log('🧪 اختبار الدوال الجديدة المدموجة...\n');
    
    try {
        // اختبار دالة daily_credits - التحقق
        console.log('1. اختبار daily_credits (check)...');
        const checkResponse = await fetch(`${baseURL}/daily_credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'check',
                userEmail: 'test@example.com'
            })
        });
        const checkResult = await checkResponse.json();
        console.log('✅ تحقق الكريديت اليومية:', checkResult);

        // اختبار دالة daily_credits - الطلب
        console.log('\n2. اختبار daily_credits (claim)...');
        const claimResponse = await fetch(`${baseURL}/daily_credits`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'claim',
                userEmail: 'test@example.com'
            })
        });
        const claimResult = await claimResponse.json();
        console.log('✅ طلب الكريديت اليومية:', claimResult);

        // اختبار دالة submit - طلب دعم
        console.log('\n3. اختبار submit (support)...');
        const supportResponse = await fetch(`${baseURL}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'support',
                email: 'test@example.com',
                category: 'technical',
                message: 'هذا اختبار لطلب الدعم',
                userId: 'test-user-id'
            })
        });
        const supportResult = await supportResponse.json();
        console.log('✅ طلب الدعم:', supportResult);

        // اختبار دالة submit - بلاغ خطأ
        console.log('\n4. اختبار submit (bug)...');
        const bugResponse = await fetch(`${baseURL}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'bug',
                userId: 'test-user-id',
                userEmail: 'test@example.com',
                issueType: 'performance',
                description: 'هذا اختبار لبلاغ خطأ',
                browserInfo: 'Chrome 110.0.0.0'
            })
        });
        const bugResult = await bugResponse.json();
        console.log('✅ بلاغ الخطأ:', bugResult);

    } catch (error) {
        console.error('❌ خطأ في الاختبار:', error);
    }
};

// تشغيل الاختبارات
testNewAPIEndpoints();