const Brand = require("../models/brand.model");
const { pipeline } = require('stream/promises');

const upload = require("../middleware/upload.middleware");
const fs = require("fs");
const path = require("path");
const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({
      isActive: true,
    }).sort({
      "name": 1,
    });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

// const getBrandById = async (req, res, next) => {
//   try {
//     const brand = await Brand.findById(req.params.id);

//     if (!brand || !brand.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: "Brand not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: brand,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const createBrand = async (req, res, next) => {
  try {
    const { name, isTop } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu brand names are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Brand image is required",
      });
    }

    const existingBrand = await Brand.findOne({
      $or: [
        { "name.en": name.trim() },
        { "name.ur": name.trim() },
      ],
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const imageUrl =
      `/uploads/${req.file.filename}`;

    const brand = await Brand.create({
      name: name.trim(),
      image: imageUrl,
      isTop: isTop === "true" || isTop === true,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { name, isTop, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

      brand.name = name.trim();

    if (isActive !== undefined) {
      brand.isActive =
        isActive === "true" || isActive === true;
    }

    if (isTop !== undefined) {
      brand.isTop =
        isTop === "true" || isTop === true;
    }           

    // Replace image if a new one was uploaded
    if (req.file) {
      deleteImage(brand.image);

      brand.image = 
        `/uploads/${req.file.filename}`;
    }

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    brand.isActive = false;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteImage = (imageUrl) => {
  if (!imageUrl) return;

  const relativePath = imageUrl.replace(
    "src/uploads/",
    ""
  );

  const filePath = path.join(
    process.cwd(),
    "uploads",
    relativePath
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const importBrands = async (req, res, next) => {
     const brandsList = req.body;

    if (!Array.isArray(brandsList)) {
        return res.status(400).json({ error: "Invalid format. Expected a JSON array." });
    }

    const report = { successCount: 0, failedBrands: [] };

    for (const brandData of brandsList) {
        try {
            const { name, image,brand_slider_image } = brandData;

            // if (!name || !imageUrl) {
            //     report.failedBrands.push({ brand: brandData, error: "Missing name or imageUrl" });
            //     continue;
            // }
            const completeImage = image?
             'https://pictures.grocerapps.com/lgthumb/'+image
             :
             'https://pictures.grocerapps.com/lgthumb/'+brand_slider_image;

            if(image){
            // 1. Generate a unique filename to prevent overwriting
            const fileExtension = path.extname(new URL(completeImage).pathname) || '.jpg';
            const filename = `brand-${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}${fileExtension}`;
            
            // Define paths
            const uploadDir = path.join(__dirname, '../public/uploads/brands');
            const absoluteDestinationPath = path.join(uploadDir, filename);
            var relativeDatabasePath = `/uploads/brands/${filename}`; // Public URL path for your API

            // 2. Ensure directory exists 
            fs.mkdirSync(uploadDir, { recursive: true })
            // 3. Download and stream the image directly to the disk
            const response = await fetch(completeImage);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            await pipeline(
                response.body, 
                fs.createWriteStream(absoluteDestinationPath)
            );
          }
          if(!image) relativeDatabasePath = '';

            // 4. Save parsed data and local image path to your database model
            const newBrand = new Brand({
                name: name,
                image: relativeDatabasePath,
                isActive: true,   });

            await newBrand.save();
            report.successCount++;

        } catch (error) {
            console.error(`Failed to process brand: ${brandData.name || 'Unknown'}`, error);
            report.failedBrands.push({ 
                name: brandData.name || 'Unknown', 
                error: error.message 
            });
        }
    }

    // Return the summary of the bulk process
    res.status(200).json({
        message: "Bulk brand import processing complete.",
        summary: report
    });
}


 module.exports = {
  getBrands,
  // getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  importBrands
};