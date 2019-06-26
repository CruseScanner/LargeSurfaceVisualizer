#include "pch.h"

#include <gdal_priv.h>

#include <iostream>
#include <sstream>

#include <osg/Vec3f>

#include <cassert>
#include <algorithm>


GDALDataset* openDataset(const std::string& filename)
{
	GDALDataset *dataset = (GDALDataset *)GDALOpen(filename.c_str(), GA_ReadOnly);
	return dataset;
}

GDALDataset* createDataset(GDALDataType outputDataType, unsigned int resX, unsigned int resY, unsigned int channels, const std::string& outputFileName);

struct Slope {
	Slope(float* buffer, unsigned int bufferStride, float scale)
	{
		m_buffer = buffer;
		m_bufferStride = bufferStride;
		m_scale = scale;
	}
	
	float operator()(int x, int y) const
	{
		assert(x >= -1 && x <= 1);
		assert(y >= -1 && y <= 1);
		return m_scale*(*(m_buffer + x + y*m_bufferStride) - (*m_buffer));
	}
	
	float *m_buffer;
	float m_scale;
	
	int m_bufferStride;
};

void calculateNormals(float* elevationData, float *normalData, unsigned int sizeX, unsigned int sizeY, float scale)
{
	osg::Vec3f n[8];
	
	for (unsigned int y = 0; y < sizeY; y++)
	{
		for (unsigned int x = 0; x < sizeX; x++)
		{
			
			Slope s(elevationData + x + 1 + (y+1)*(sizeX+2), sizeX + 2, scale);
			
			
			n[0] = osg::Vec3f(   s(-1, 0),       0.f, 1.f);
			n[2] = osg::Vec3f(       0.f, -s(0, -1),  1.f);
			n[4] = osg::Vec3f(  -s(1, 0),       0.f,  1.f);
			n[6] = osg::Vec3f(       0.f,  s(0,  1),  1.f);

			n[1] = osg::Vec3f(  s(-1, -1), -s(-1, -1), 2.0f);
			n[3] = osg::Vec3f( -s( 1, -1), -s( 1, -1), 2.0f);
			n[5] = osg::Vec3f( -s( 1,  1),  s( 1,  1), 2.0f);
			n[7] = osg::Vec3f(  s(-1,  1),  s(-1,  1), 2.0f);
			
			osg::Vec3f N(0.0f, 0.0f, 0.0f);
			for (int i = 0; i < 8; i++)
			{
				n[i].normalize();
				N+= n[i];
			}
			N.normalize();
			
			// Range map into [0..255]
			(normalData + (x + y*sizeY)*3)[0] = (N.x()*0.5f+0.5f)*255.f;
			(normalData + (x + y*sizeY)*3)[1] = (N.y()*0.5f+0.5f)*255.f;
			(normalData + (x + y*sizeY)*3)[2] = (N.z()*255.f);
		}
	}
	
}

void createNormalMaps(const std::string& inputFileName, const std::string& outputFileName, float scale)
{
	GDALDataset* inputDataset = openDataset(inputFileName);
	
	unsigned int resX = inputDataset->GetRasterXSize();
	unsigned int resY = inputDataset->GetRasterYSize();
	GDALRasterBand* elevationBand = inputDataset->GetRasterBand(1);

	GDALDataset* outputDataset = createDataset(GDT_Byte, resX, resY, 3, outputFileName);

	
	const unsigned int TILESIZE = 256;
	unsigned int tilesX = (resX + (TILESIZE-1))/TILESIZE;
	unsigned int tilesY = (resY + (TILESIZE-1))/TILESIZE;
	
	std::vector<float> e((TILESIZE + 2)*(TILESIZE + 2));
	std::vector<float> normalData(TILESIZE*TILESIZE*3);
	float *elevationData = e.data();

	for (unsigned int ty = 0; ty < tilesY; ty++)
	{
		for (unsigned int tx = 0; tx < tilesX; tx++)
		{
			std::cout<<"Processing tile "<<tx+ty*tilesX<<" of "<<tilesX*tilesY<<std::endl;

			unsigned int ix = tx*TILESIZE;
			unsigned int iy = ty*TILESIZE;
			unsigned int iw = TILESIZE + 1;
			unsigned int ih = TILESIZE + 1;

			unsigned int ioffsx;
			unsigned int ioffsy;
		
			if (ix > 0) 
			{
				ix--; 
				iw++;
				ioffsx = 0;
			}
			else
			{
				ioffsx = 1;
			}
			
			if (iy > 0) 
			{ 
				iy--; 
				ih++; 
				ioffsy = 0;
			}
			else
			{
				ioffsy = 1;
			}

			iw = std::min(iw, resX - ix);
			ih = std::min(ih, resY - iy);
			float *elevationDataWindow =  elevationData + ioffsx + ioffsy*(TILESIZE+2);

			if (CE_None != elevationBand->RasterIO(GF_Read, ix, iy, iw, ih, static_cast<void*>(elevationDataWindow), iw, ih, GDT_Float32, sizeof(float), (TILESIZE+2)*sizeof(float), nullptr))
			{
				std::cout<<"Error reading tile "<<tx<<","<<ty<<std::endl;
				continue;
			}
			
			if (ioffsx > 0 && ioffsy > 0)
			{
				elevationData[0] = *(elevationData + 1 + TILESIZE+2);
			}
			if (ioffsx > 0)
			{
				for (int y = 0; y < TILESIZE+2; y++)
				{
					elevationData[y*(TILESIZE+2)] = elevationData[y*(TILESIZE+2) + 1];
				}
			}
			if (ioffsy > 0)
			{
				for (int x = 0; x < TILESIZE+2; x++)
				{
					elevationData[x] = elevationData[x + (TILESIZE+2)];
				}
			}
			
			calculateNormals(elevationData, normalData.data(), TILESIZE, TILESIZE, scale);
			
			unsigned int ox = tx*TILESIZE;
			unsigned int oy = ty*TILESIZE;

			unsigned int ow = std::min(TILESIZE, resX - ox);
			unsigned int oh = std::min(TILESIZE, resY - oy);
			
			if (CE_None != outputDataset->RasterIO(GF_Write, ox, oy, ow, oh, normalData.data(), ow, oh, GDT_Float32, 3, nullptr, sizeof(float)*3, TILESIZE*sizeof(float)*3, sizeof(float), nullptr))
			{
				std::cout<<"Error writing normal map tile "<<tx<<","<<ty<<std::endl;
			}
		}
	}


	int downsamplingFactor = 2;
	std::vector<int> overviewLevels;
	while (resX > 256 || resY > 256)
	{
		resX = (resX+1)/2;
		resY = (resY+1)/2;
		overviewLevels.push_back(downsamplingFactor);
		downsamplingFactor*= 2;
	}


	std::vector<int> rasterBands{1,2,3};

	// Build overviews by averaging; should be done explicitly in order to renormalize
	outputDataset->BuildOverviews("AVERAGE",
			overviewLevels.size(), overviewLevels.data(),
			rasterBands.size(), rasterBands.data(),
			nullptr, nullptr
	);

	GDALClose(outputDataset);
}


GDALDataset* createDataset(GDALDataType outputDataType, unsigned int resX, unsigned int resY, unsigned int channels, const std::string& outputFileName)
{
	// Create output dataset
	std::string driverID = "GTiff";
	std::vector<std::pair<std::string, std::string>> creationOptions{
			{"TILED", "YES"},
			{"BIGTIFF", "YES"},
			{"BLOCKXSIZE", "256"},
			{"BLOCKYSIZE", "256"}
	};

	GDALDriver* driver = (GDALDriver*)GDALGetDriverByName(driverID.c_str());
	if (!driver)
	{
		std::cerr<<"Could not initialize driver with ID "<<driverID.c_str()<<std::endl;
		return 0;
	}

	char **options = NULL;
	for (std::size_t i = 0; i < creationOptions.size(); i++)
	{
		options = CSLSetNameValue(options, creationOptions[i].first.c_str(), creationOptions[i].second.c_str());
	}

	GDALDataset* outputDataset = (GDALDataset*)GDALCreate(driver, outputFileName.c_str(),
														  resX, resY,
														  channels, outputDataType,
														  options);

	if (!outputDataset)
	{
		std::cerr<<"Failed to create output dataset "<<outputFileName.c_str()<<std::endl;
		return 0;
	}

	for (unsigned int c = 0; c < channels; c++)
	{
		GDALRasterBand* band = outputDataset->GetRasterBand(c+1);
		band->SetColorInterpretation(channels > 1 ? static_cast<GDALColorInterp>(GCI_RedBand + c) : GCI_Undefined);
	}
	int downsamplingFactor = 2;
	std::vector<int> overviewLevels;
	while (resX > 256 || resY > 256)
	{
		resX = (resX+1)/2;
		resY = (resY+1)/2;
		overviewLevels.push_back(downsamplingFactor);
		downsamplingFactor*= 2;
	}


	std::vector<int> rasterBands;
	for (int i = 0; i < channels; i++)
	{
		rasterBands.push_back(i + 1);
	}

	outputDataset->BuildOverviews("NONE",
			overviewLevels.size(), overviewLevels.data(),
			rasterBands.size(), rasterBands.data(),
			nullptr, nullptr
	);

	return outputDataset;
}


int main(int argc, char** argv)
{
	if (argc != 4)
	{
		std::cout<<"Usage: create-normal-map <depthrange> <resolution> <elev.tif> <normal-map.tif>"<<std::endl;
		std::cout<<std::endl;
		std::cout<<"depthrange is the maximal depth in mm minus the minimal depth in mm"<<std::endl;
        std::cout << "resolution is the image resolution in dpi" << std::endl;

        std::cout<<std::endl;
		return 1;
	}
    const float drange = atof(argv[1]);
    const float dpi = atof(argv[2]);

	const float scale = (drange * dpi) / ( 25.4 * 65535.0);
	const std::string elevationFilename = argv[3];
	const std::string normalMapFilename = argv[4];

	GDALAllRegister();
	createNormalMaps(elevationFilename, normalMapFilename, scale);
	return 0;
}
