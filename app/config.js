module.exports = (function () {
    // if production
    if (process.env.NODE_ENV === 'production') {
        return {
            // Database configuration
            db: {
                a: '',
                host: '127.0.0.1',
                port: '27017',
                name: 'lovecoy',
                user: 'lovecoy',
                pass: 'lovecoy'
            },
            ssl:{
                key:'cert/example.com.key',
                cert:'cert/example.com.crt'
            },
            host: "api.lovecoy.com",
            port: "80",
            securePort:"4433",
            emailConfig : {
                smtpEmail : 'test.infyzo@gmail.com',
                smtpPassword : 'Product@InfyTest',
                emailTitle : 'Lovecoy',
                emailSubject : 'Please confirm your Email account'
            }
        }
    }

    // return if development
    return {
        // Database configuration
        db: {
            host: '192.168.1.254',
            port: '27017',
            name: 'lovecoy',
            user: 'lovecoy',
            pass: 'lovecoy'
        },
        ssl:{
            key:'cert/example.com.key',
            cert:'cert/example.com.crt'
        },
        host: "192.168.1.104",
        port: "9000",
        securePort:"9900",
        emailConfig : {
            smtpEmail : 'test.infyzo@gmail.com',
            smtpPassword : 'Product@InfyTest',
            emailTitle : 'Lovecoy',
            emailSubject : 'Please check your OTP'
        }
    }
})();