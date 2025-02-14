const shortid = require("shortid");
const ShortUrl = require("../model/shorturl");
const Analytics = require("../model/userUrlAnalitycs");
const geoip = require("geoip-lite");
const redisClient = require('../config/redisConfig');

const isValidUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlRegex.test(url);
};


exports.shortenUrl = async (req, res) => {
    try {
        const { longUrl, customAlias, topic } = req.body;
        const userID = req.headers.userID;

        //  Validate input URL
        if (!longUrl || !isValidUrl(longUrl)) {
            return res.status(400).json({ error: "Invalid URL. Please provide a valid URL." });
        }

        // Check if a custom alias is provided and ensure it's unique
        if (customAlias) {
            const existingAlias = await ShortUrl.findOne({ shortUrl: customAlias });
            if (existingAlias) {
                return res.status(400).json({ error: "Custom alias is already in use." });
            }
        }

        // Generate a unique short URL if no custom alias is provided
        let shortUrl = customAlias || shortid.generate();

        // Save to database
        const newShortUrl = new ShortUrl({
            createdBy: userID,
            longUrl,
            shortUrl,
            customAlias: customAlias || null,
            topic: topic || "general",
        });

        await newShortUrl.save();

        //  Construct full short URL
        //const shortUrlFull = `${req.protocol}://${req.headers.host}/${shortUrl}`;

        // Send response
        return res.status(201).json({
            message: "URL shortened successfully",
            shortUrl: shortUrl,
            createdAt: newShortUrl.createdAt,
        });

    } catch (error) {
        console.error("Error shortening URL:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.RedirectToUrl = async (req, res) => {
    try {
        const { alias } = req.params;

        const cachedRedirectURL = await redisClient.get(`RedirectUrl:${alias}`);
        const headerAccept = req.headers.accept || "";
        console.log(headerAccept, "Header");

        // ✅ Return from cache if available
        if (cachedRedirectURL) {
            if (headerAccept.includes("text/html")) {
                console.log("🚀 Redirecting to Cached URL:", cachedRedirectURL);
                return res.redirect(cachedRedirectURL);
            } else {
                return res.status(200).json({ 
                    message: "Redirect URL found (Cached)", 
                    redirectUrl: cachedRedirectURL // ✅ No need for JSON.parse()
                });
            }
        }

    
        const fetchOriginalURl = await ShortUrl.findOne({ customAlias: alias });

        const userIp =
            req.headers["x-forwarded-for"]?.split(",")[0] || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress ||
            req.ip;

        
        const geo = geoip.lookup(userIp) || {};

        
        const userDeviceInfo = {
            ip: userIp,
            browser: req.useragent.browser,
            version: req.useragent.version,
            os: req.useragent.os,
            platform: req.useragent.platform,
            deviceType: req.useragent.isMobile ? "Mobile" : req.useragent.isTablet ? "Tablet" : "Desktop",
            source: req.useragent.source,  
            location: {
                country: geo.country || "Unknown",
                region: geo.region || "Unknown",
                city: geo.city || "Unknown",
            },
        };


        let existingUser = await Analytics.findOne({"deviceDetails.ip": userDeviceInfo.ip});

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        let createUserDeatils = await Analytics.create({
            userId:existingUser ? existingUser . userId : result,
            shortUrlId:fetchOriginalURl._id,
            deviceDetails:userDeviceInfo

        })
    
        const acceptHeader = req.headers.accept || "";

        if (acceptHeader.includes("text/html")) {
            
            return res.redirect(fetchOriginalURl.longUrl);
        } else {
            await redisClient.setEx(`RedirctUrl:${alias}`, 900, JSON.stringify(fetchOriginalURl.longUrl));
            
            return res.status(200).json({
                message: "Redirect URL found",
                redirectUrl: fetchOriginalURl.longUrl
            });
        }

    } catch (error) {
        console.error("Error redirect URL:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.Analytics = async (req, res) => {
    try {
        const { alias } = req.params;

        const cachedAnalytics = await redisClient.get(`AnalyticsByAlias:${alias}`);
        if (cachedAnalytics) {
            return res.status(200).json({ data: JSON.parse(cachedAnalytics), message: "Alias Analytics (Cached)" });
        }
    
        const fetchURl = await ShortUrl.findOne({ customAlias: alias });

        let fetchAnaliticsData = await Analytics.find({shortUrlId: fetchURl._id});
        
        let uniqueUserIds = new Set(fetchAnaliticsData.map(entry => entry.userId).filter(userId => userId));
        let uniqueOS = new Set(fetchAnaliticsData.map(entry => entry.deviceDetails.os));
        let uniqueDeviceType = new Set(fetchAnaliticsData.map(entry => entry.deviceDetails.deviceType));

        let ostype = [];
        let devicetype = [];

        for(let i of uniqueOS){
            let analyticsData = await Analytics.find({shortUrlId: fetchURl._id,"deviceDetails.os": i});
            let uniqueUserByOs = new Set(analyticsData.map(entry => entry.userId).filter(userId => userId));
            let type = {
                osName: i,
                uniqueClicks: uniqueUserByOs.size,
                uniqueUsers: uniqueUserByOs.size
            }
            ostype.push(type)
        }

        for(let j of uniqueDeviceType){
            let analyticsData = await Analytics.find({shortUrlId: fetchURl._id,"deviceDetails.deviceType": j});
            let uniqueUserByOs = new Set(analyticsData.map(entry => entry.userId).filter(userId => userId));
            

            let device = {
                osName: j,
                uniqueClicks: uniqueUserByOs.size,
                uniqueUsers: uniqueUserByOs.size
            }
            devicetype.push(device)
        }
         

        let response = {
            totalClicks: fetchAnaliticsData.length,
            uniqueUsers: uniqueUserIds.size,
            clicksByDate: fetchAnaliticsData.map(m => m.createdAt),
            osType: ostype,
            deviceType: devicetype
        }

        await redisClient.setEx(`AnalyticsByAlias:${alias}`, 900, JSON.stringify(response));
        
            return res.status(200).json({
                data: response,
                message: "Analytics Data"
            });
        

    } catch (error) {
        console.error("Error redirect URL:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.AnalyticsByTopic = async (req, res) => {
    try {
        const { topic } = req.params;

        const cachedAnalytics = await redisClient.get(`AnalyticsByTopic:${topic}`);
        if (cachedAnalytics) {
            return res.status(200).json({ data: JSON.parse(cachedAnalytics), message: "Topic Analytics (Cached)" });
        }
    
        const fetchURl = await ShortUrl.findOne({ topic: topic });

        let fetchAnaliticsData = await Analytics.find({shortUrlId: fetchURl._id});
        
        let uniqueUserIds = new Set(fetchAnaliticsData.map(entry => entry.userId).filter(userId => userId));

        let urls = [];
        
        let data = {
            shortUrl: fetchURl.shortUrl,
            totalClicks: fetchAnaliticsData.length,
            uniqueUsers: uniqueUserIds.size
        }
        urls.push(data)

        let response = {
            totalClicks: fetchAnaliticsData.length,
            uniqueUsers: uniqueUserIds.size,
            clicksByDate: fetchAnaliticsData.map(m => m.createdAt),
            urls: urls,
        }

        await redisClient.setEx(`AnalyticsByTopic:${topic}`, 900, JSON.stringify(response));
        
            return res.status(200).json({
                data: response,
                message: "Analytics by topic Data"
            });
        

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.OverAllAnalytics = async (req, res) => {
    try {
        const userID = req.headers.userID;

        // Check Redis Cache
        const cachedAnalytics = await redisClient.get(`overallAnalytics:${userID}`);
        if (cachedAnalytics) {
            console.log("Cache hit: Returning overall analytics from Redis");
            return res.status(200).json({ data: JSON.parse(cachedAnalytics), message: "Overall Analytics (Cached)" });
        }

        // Fetch all URLs created by user
        const fetchURl = await ShortUrl.find({ createdBy: userID });

        if (fetchURl.length === 0) {
            return res.status(200).json({
                data: { totalUrls: 0, totalClicks: 0, uniqueUsers: 0, clicksByDate: [], osType: [], deviceType: [] },
                message: "No data found"
            });
        }

        // Fetch all analytics data in one query
        const analyticsData = await Analytics.find({ shortUrlId: { $in: fetchURl.map(url => url._id) } });

        let totalClick = analyticsData.length;
        let uniqueUserIds = new Set(analyticsData.map(entry => entry.userId).filter(Boolean));
        let clicksByDate = analyticsData.map(m => m.createdAt);

        // Organize OS and Device data
        let osTypeMap = new Map();
        let deviceTypeMap = new Map();

        for (let entry of analyticsData) {
            if (entry.deviceDetails?.os) {
                if (!osTypeMap.has(entry.deviceDetails.os)) osTypeMap.set(entry.deviceDetails.os, new Set());
                osTypeMap.get(entry.deviceDetails.os).add(entry.userId);
            }
            if (entry.deviceDetails?.deviceType) {
                if (!deviceTypeMap.has(entry.deviceDetails.deviceType)) deviceTypeMap.set(entry.deviceDetails.deviceType, new Set());
                deviceTypeMap.get(entry.deviceDetails.deviceType).add(entry.userId);
            }
        }

        let ostype = Array.from(osTypeMap, ([osName, users]) => ({ osName, uniqueClicks: users.size }));
        let devicetype = Array.from(deviceTypeMap, ([deviceName, users]) => ({ deviceName, uniqueClicks: users.size }));

        let response = { totalUrls: fetchURl.length, totalClicks: totalClick, uniqueUsers: uniqueUserIds.size, clicksByDate, osType: ostype, deviceType: devicetype };

        // Cache the result for 30 minutes
        await redisClient.setEx(`overallAnalytics:${userID}`, 900, JSON.stringify(response));

        return res.status(200).json({ data: response, message: "Overall Analytics" });

    } catch (error) {
        console.error("Error in OverAllAnalytics:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
